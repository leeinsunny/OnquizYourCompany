import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { StickyNote, Save, Trash2, Pencil, Plus } from "lucide-react";

interface CalendarNotesProps {
  selectedDate: Date;
  onNoteDatesChange: (dates: Date[]) => void;
}

interface NoteData {
  id: string;
  content: string;
}

const CalendarNotes = ({ selectedDate, onNoteDatesChange }: CalendarNotesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState<NoteData | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchNote = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_notes")
      .select("id, content")
      .eq("user_id", user.id)
      .eq("note_date", dateStr)
      .maybeSingle();

    if (data) {
      setNote({ id: data.id, content: data.content });
      setDraft(data.content);
      setEditing(false);
    } else {
      setNote(null);
      setDraft("");
      setEditing(false);
    }
  }, [user, dateStr]);

  const fetchAllNoteDates = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_notes")
      .select("note_date")
      .eq("user_id", user.id);

    if (data) {
      onNoteDatesChange(data.map((d: any) => new Date(d.note_date + "T00:00:00")));
    }
  }, [user, onNoteDatesChange]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  useEffect(() => {
    fetchAllNoteDates();
  }, [fetchAllNoteDates]);

  const handleSave = async () => {
    if (!user || !draft.trim()) return;
    setSaving(true);
    try {
      if (note) {
        await supabase
          .from("user_notes")
          .update({ content: draft.trim(), updated_at: new Date().toISOString() })
          .eq("id", note.id);
      } else {
        await supabase.from("user_notes").insert({
          user_id: user.id,
          note_date: dateStr,
          content: draft.trim(),
        });
      }
      toast({ title: "저장 완료", description: "메모가 저장되었습니다." });
      await fetchNote();
      await fetchAllNoteDates();
    } catch {
      toast({ title: "오류", description: "저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    setSaving(true);
    try {
      await supabase.from("user_notes").delete().eq("id", note.id);
      setNote(null);
      setDraft("");
      setEditing(false);
      toast({ title: "삭제 완료", description: "메모가 삭제되었습니다." });
      await fetchAllNoteDates();
    } catch {
      toast({ title: "오류", description: "삭제에 실패했습니다.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const displayDate = format(selectedDate, "M월 d일 (EEEE)", { locale: ko });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">{displayDate} 메모</CardTitle>
          </div>
          {note && !editing && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {note && !editing ? (
          <div
            className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3 cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => setEditing(true)}
          >
            {note.content}
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="오늘의 할 일이나 메모를 작성하세요..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
            />
            <div className="flex gap-2 justify-end">
              {(note || draft) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (note) {
                      setDraft(note.content);
                      setEditing(false);
                    } else {
                      setDraft("");
                    }
                  }}
                >
                  취소
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !draft.trim()}
                className="gap-1"
              >
                {saving ? (
                  "저장 중..."
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        {!note && !editing && !draft && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground gap-2"
            onClick={() => setEditing(true)}
          >
            <Plus className="h-4 w-4" />
            메모 추가
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarNotes;
