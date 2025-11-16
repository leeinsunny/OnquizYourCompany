import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuizQuestion {
  id: string;
  question_text: string;
  options: Array<{
    text: string;
    is_correct: boolean;
  }>;
  explanation: string;
}

interface QuizReviewDialogProps {
  open: boolean;
  questions: QuizQuestion[];
  onConfirm: (editedQuestions: QuizQuestion[]) => void;
  onCancel: () => void;
}

export const QuizReviewDialog = ({
  open,
  questions: initialQuestions,
  onConfirm,
  onCancel
}: QuizReviewDialogProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);

  // Update questions when prop changes or dialog opens
  useEffect(() => {
    if (open && initialQuestions) {
      console.log('Setting questions in review dialog:', initialQuestions.length, 'questions');
      setQuestions(initialQuestions);
    }
  }, [initialQuestions, open]);

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleEditQuestion = (questionId: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleEditOption = (questionId: string, optionIndex: number, field: string, value: any) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
        // If setting this option as correct, uncheck others
        if (field === 'is_correct' && value === true) {
          newOptions.forEach((opt, idx) => {
            if (idx !== optionIndex) opt.is_correct = false;
          });
        }
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>생성된 퀴즈 확인 및 수정</DialogTitle>
          <DialogDescription>
            AI가 생성한 {questions.length}개의 퀴즈 문제를 확인하고 필요시 수정하세요.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[55vh] pr-4">
          <div className="space-y-4 py-4">
            {questions.map((question, qIndex) => (
              <Card key={question.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">문제 {qIndex + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Text */}
                  <div className="space-y-2">
                    <Label>질문</Label>
                    <Textarea
                      value={question.question_text}
                      onChange={(e) => handleEditQuestion(question.id, 'question_text', e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <Label>선택지</Label>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-start gap-2">
                          <div
                            className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 cursor-pointer transition-colors ${
                              option.is_correct
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/30 hover:border-primary'
                            }`}
                            onClick={() => handleEditOption(question.id, optIndex, 'is_correct', !option.is_correct)}
                          >
                            {option.is_correct && <Check className="h-4 w-4" />}
                          </div>
                          <Input
                            value={option.text}
                            onChange={(e) => handleEditOption(question.id, optIndex, 'text', e.target.value)}
                            placeholder={`선택지 ${optIndex + 1}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      원을 클릭하여 정답을 선택하세요
                    </p>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-2">
                    <Label>해설 (선택사항)</Label>
                    <Textarea
                      value={question.explanation}
                      onChange={(e) => handleEditQuestion(question.id, 'explanation', e.target.value)}
                      placeholder="정답에 대한 설명을 입력하세요"
                      className="min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button 
            onClick={() => onConfirm(questions)}
            disabled={questions.length === 0 || questions.some(q => !q.question_text.trim() || q.options.every(o => !o.is_correct))}
          >
            다음 단계로
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
