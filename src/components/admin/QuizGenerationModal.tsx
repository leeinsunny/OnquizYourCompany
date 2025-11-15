import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QuizQuestion {
  id: string;
  question_text: string;
  options: Array<{
    text: string;
    is_correct: boolean;
  }>;
  explanation: string;
}

interface QuizGenerationModalProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  companyId: string;
  userId: string;
  extractedText: string;
  onComplete: () => void;
}

export const QuizGenerationModal = ({
  open,
  onClose,
  documentId,
  documentTitle,
  companyId,
  userId,
  extractedText: initialText,
  onComplete
}: QuizGenerationModalProps) => {
  const [step, setStep] = useState<'text-review' | 'generating' | 'quiz-review' | 'title-input'>('text-review');
  const [extractedText, setExtractedText] = useState(initialText);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleNextFromTextReview = async () => {
    setStep('generating');
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { text: extractedText }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      const questionsWithIds = data.questions.map((q: any, index: number) => ({
        ...q,
        id: `question-${index}`
      }));

      setQuestions(questionsWithIds);
      setGenerationProgress(100);
      
      setTimeout(() => {
        setStep('quiz-review');
        setIsGenerating(false);
      }, 500);
    } catch (error: any) {
      console.error('Quiz generation error:', error);
      toast.error(error.message || "퀴즈 생성 중 오류가 발생했습니다");
      setStep('text-review');
      setIsGenerating(false);
    }
  };

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

  const handleNextFromQuizReview = () => {
    if (questions.length === 0) {
      toast.error("최소 1개의 문제가 필요합니다");
      return;
    }
    setStep('title-input');
  };

  const handleComplete = async () => {
    if (!quizTitle.trim()) {
      toast.error("퀴즈 제목을 입력해주세요");
      return;
    }

    setIsSaving(true);

    try {
      // Create or get category
      let catId = categoryId;
      if (!catId) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .insert({
            company_id: companyId,
            document_id: documentId,
            name: "기본 카테고리",
            description: "자동 생성된 카테고리"
          })
          .select()
          .single();

        if (categoryError) throw categoryError;
        catId = categoryData.id;
        setCategoryId(catId);
      }

      // Create quiz
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          company_id: companyId,
          category_id: catId,
          title: quizTitle,
          description: `${documentTitle}에서 생성된 퀴즈`,
          created_by: userId,
          is_active: true,
          pass_score: 70
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions and options
      for (const [questionIndex, question] of questions.entries()) {
        const { data: questionData, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            quiz_id: quizData.id,
            question_text: question.question_text,
            question_type: 'multiple_choice',
            points: 1,
            order_index: questionIndex
          })
          .select()
          .single();

        if (questionError) throw questionError;

        for (const [optionIndex, option] of question.options.entries()) {
          const { error: optionError } = await supabase
            .from('quiz_options')
            .insert({
              question_id: questionData.id,
              option_text: option.text,
              is_correct: option.is_correct,
              explanation: option.is_correct ? question.explanation : null,
              order_index: optionIndex
            });

          if (optionError) throw optionError;
        }
      }

      // Update document status to approved
      await supabase
        .from('documents')
        .update({ status: 'approved' })
        .eq('id', documentId);

      toast.success("퀴즈가 생성되었습니다!");
      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || "저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (step === 'generating') return; // 생성 중에는 취소 불가
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'text-review' && "추출된 텍스트 확인"}
            {step === 'generating' && "퀴즈 생성 중"}
            {step === 'quiz-review' && "퀴즈 검토 및 수정"}
            {step === 'title-input' && "퀴즈 제목 입력"}
          </DialogTitle>
          <DialogDescription>
            {step === 'text-review' && "추출된 내용을 확인하고 필요시 수정하세요"}
            {step === 'generating' && "AI가 퀴즈를 생성하고 있습니다"}
            {step === 'quiz-review' && "생성된 퀴즈를 검토하고 수정하세요"}
            {step === 'title-input' && "퀴즈 목록의 제목을 입력하세요"}
          </DialogDescription>
        </DialogHeader>

        {step === 'text-review' && (
          <div className="space-y-4">
            <div>
              <Label>추출된 텍스트</Label>
              <Textarea
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                rows={20}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleNextFromTextReview}>
                다음
              </Button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">퀴즈를 생성하고 있습니다...</p>
              <Progress value={generationProgress} className="w-full max-w-md" />
              <p className="text-sm text-muted-foreground">{generationProgress}%</p>
            </div>
          </div>
        )}

        {step === 'quiz-review' && (
          <div className="space-y-4">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {questions.map((question, qIndex) => (
                <Card key={question.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">문제 {qIndex + 1}</Label>
                        <Textarea
                          value={question.question_text}
                          onChange={(e) => handleEditQuestion(question.id, 'question_text', e.target.value)}
                          rows={2}
                          className="mt-2"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <Button
                          variant={option.is_correct ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleEditOption(question.id, optIndex, 'is_correct', !option.is_correct)}
                        >
                          {option.is_correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </Button>
                        <Input
                          value={option.text}
                          onChange={(e) => handleEditOption(question.id, optIndex, 'text', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    ))}
                    <div className="mt-3">
                      <Label className="text-sm">해설</Label>
                      <Textarea
                        value={question.explanation}
                        onChange={(e) => handleEditQuestion(question.id, 'explanation', e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">총 {questions.length}개의 문제</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  취소
                </Button>
                <Button onClick={handleNextFromQuizReview}>
                  다음
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'title-input' && (
          <div className="space-y-4">
            <div>
              <Label>퀴즈 제목</Label>
              <Input
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="예: 회사 소개 퀴즈"
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('quiz-review')}>
                이전
              </Button>
              <Button onClick={handleComplete} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "완성하기"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
