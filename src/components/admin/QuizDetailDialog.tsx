import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    if (open && quizId) {
      fetchQuestions();
    }
  }, [open, quizId]);

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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{quizTitle}</DialogTitle>
          <DialogDescription>
            총 {questions.length}개의 문제
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
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
              {questions.map((question, qIndex) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      문제 {qIndex + 1}. {question.question_text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {question.quiz_options.map((option, optIndex) => (
                      <div
                        key={option.id}
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
                          {option.is_correct && option.explanation && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>해설:</strong> {option.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
