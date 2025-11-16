import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextReviewDialogProps {
  open: boolean;
  text: string;
  onConfirm: (editedText: string) => void;
  onCancel: () => void;
}

export const TextReviewDialog = ({
  open,
  text,
  onConfirm,
  onCancel
}: TextReviewDialogProps) => {
  const [editedText, setEditedText] = useState(text);

  // Update editedText when text prop changes or dialog opens
  useEffect(() => {
    if (open && text) {
      console.log('Setting extracted text in dialog:', text.length, 'characters');
      setEditedText(text);
    }
  }, [text, open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>추출된 텍스트 확인</DialogTitle>
          <DialogDescription>
            PDF에서 추출된 텍스트를 확인하고 필요시 수정하세요. 이 텍스트를 기반으로 퀴즈가 생성됩니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0">
          <div className="space-y-2">
            <Label htmlFor="extracted-text">추출된 텍스트</Label>
            <Textarea
              id="extracted-text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[300px] max-h-[50vh] font-mono text-sm resize-none"
              placeholder="추출된 텍스트가 여기에 표시됩니다..."
            />
            <p className="text-sm text-muted-foreground">
              {editedText.length} 글자 | 약 {Math.ceil(editedText.length / 500)} 페이지 분량
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button onClick={() => onConfirm(editedText)} disabled={!editedText.trim()}>
            다음 단계로
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
