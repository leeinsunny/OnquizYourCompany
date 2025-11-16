import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Edit2, Save, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question_text: string;
  order_index: number;
  quiz_options: Array<{
    id: string;
    option_text: string;
    is_correct: boolean;
    explanation: string | null;
    order_index: number;
  }>;
}

interface QuizDetailDialogProps {
  open: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
}

export const QuizDetailDialog = ({ open, onClose, quizId, quizTitle }: QuizDetailDialogProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState<QuizQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && quizId) {
      fetchQuestions();
      setIsEditing(false); // Reset editing state when dialog opens
    }
  }, [open, quizId]);

  useEffect(() => {
    if (!isEditing) {
      setEditedQuestions(questions);
    }
  }, [questions, isEditing]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select(`
          id,
          question_text,
          order_index,
          quiz_options (
            id,
            option_text,
            is_correct,
            explanation,
            order_index
          )
        `)
        .eq('quiz_id', quizId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      // Sort options by order_index
      const questionsWithSortedOptions = data.map(q => ({
        ...q,
        quiz_options: q.quiz_options.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      }));

      setQuestions(questionsWithSortedOptions as QuizQuestion[]);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update questions
      for (const question of editedQuestions) {
        const { error: qError } = await supabase
          .from('quiz_questions')
          .update({ question_text: question.question_text })
          .eq('id', question.id);

        if (qError) throw qError;

        // Update options
        for (const option of question.quiz_options) {
          const { error: oError } = await supabase
            .from('quiz_options')
            .update({
              option_text: option.option_text,
              is_correct: option.is_correct,
              explanation: option.explanation
            })
            .eq('id', option.id);

          if (oError) throw oError;
        }
      }

      toast.success("퀴즈가 성공적으로 수정되었습니다");
      setIsEditing(false);
      await fetchQuestions();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error("퀴즈 저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionChange = (questionIndex: number, field: string, value: any) => {
    setEditedQuestions(prev => {
      const updated = [...prev];
      updated[questionIndex] = { ...updated[questionIndex], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    setEditedQuestions(prev => {
      const updated = [...prev];
      const updatedOptions = [...updated[questionIndex].quiz_options];
      updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], [field]: value };
      updated[questionIndex] = { ...updated[questionIndex], quiz_options: updatedOptions };
      return updated;
    });
  };

  const handleAddOption = (questionIndex: number) => {
    setEditedQuestions(prev => {
      const updated = [...prev];
      const newOption = {
        id: `temp-${Date.now()}`,
        option_text: "",
        is_correct: false,
        explanation: null,
        order_index: updated[questionIndex].quiz_options.length
      };
      updated[questionIndex] = {
        ...updated[questionIndex],
        quiz_options: [...updated[questionIndex].quiz_options, newOption]
      };
      return updated;
    });
  };

  const handleDeleteOption = async (questionIndex: number, optionIndex: number, optionId: string) => {
    if (!optionId.startsWith('temp-')) {
      try {
        const { error } = await supabase
          .from('quiz_options')
          .delete()
          .eq('id', optionId);

        if (error) throw error;
        toast.success("옵션이 삭제되었습니다");
      } catch (error) {
        console.error('Error deleting option:', error);
        toast.error("옵션 삭제 중 오류가 발생했습니다");
        return;
      }
    }

    setEditedQuestions(prev => {
      const updated = [...prev];
      updated[questionIndex] = {
        ...updated[questionIndex],
        quiz_options: updated[questionIndex].quiz_options.filter((_, idx) => idx !== optionIndex)
      };
      return updated;
    });
  };

  const handleCancel = () => {
    setEditedQuestions(questions);
    setIsEditing(false);
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedQuestions(questions);
    onClose();
  };

  const displayQuestions = isEditing ? editedQuestions : questions;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{quizTitle}</DialogTitle>
              <DialogDescription>
                총 {questions.length}개의 문제
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[65vh] pr-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">문제가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayQuestions.map((question, qIndex) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>문제 {qIndex + 1}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Question Text */}
                    {isEditing ? (
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                        className="min-h-[80px]"
                      />
                    ) : (
                      <p className="font-medium">{question.question_text}</p>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                      {question.quiz_options.map((option, optIndex) => (
                        <div key={option.id}>
                          {isEditing ? (
                            <div className="space-y-2 p-3 border rounded-lg">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={option.is_correct}
                                  onCheckedChange={(checked) => 
                                    handleOptionChange(qIndex, optIndex, 'is_correct', checked)
                                  }
                                />
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={option.option_text}
                                    onChange={(e) => 
                                      handleOptionChange(qIndex, optIndex, 'option_text', e.target.value)
                                    }
                                    placeholder={`선택지 ${String.fromCharCode(65 + optIndex)}`}
                                  />
                                  <Textarea
                                    value={option.explanation || ''}
                                    onChange={(e) => 
                                      handleOptionChange(qIndex, optIndex, 'explanation', e.target.value)
                                    }
                                    placeholder="해설 (선택사항)"
                                    className="min-h-[60px]"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteOption(qIndex, optIndex, option.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                option.is_correct
                                  ? 'bg-success/10 border-success'
                                  : 'bg-muted/30 border-border'
                              }`}
                            >
                              <div className="mt-0.5">
                                {option.is_correct ? (
                                  <Check className="h-5 w-5 text-success" />
                                ) : (
                                  <X className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {String.fromCharCode(65 + optIndex)}. {option.option_text}
                                </p>
                                {option.explanation && (
                                  <p className="text-sm text-muted-foreground mt-2">
                                    <strong>해설:</strong> {option.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOption(qIndex)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          선택지 추가
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장하기"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              수정하기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
