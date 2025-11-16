import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, FileText, Sparkles, BookOpen, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface QuizGenerationFlowModalProps {
  open: boolean;
  currentStep: 'extracting' | 'text-review' | 'generating' | 'quiz-review' | 'title-input' | 'saving' | 'complete';
  progress: number;
}

export const QuizGenerationFlowModal = ({
  open,
  currentStep,
  progress
}: QuizGenerationFlowModalProps) => {
  const steps: Step[] = [
    {
      id: 'extracting',
      label: 'PDF 텍스트 추출',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 'text-review',
      label: '텍스트 확인',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 'generating',
      label: 'AI 퀴즈 생성',
      icon: <Sparkles className="h-6 w-6" />
    },
    {
      id: 'quiz-review',
      label: '퀴즈 확인',
      icon: <BookOpen className="h-6 w-6" />
    },
    {
      id: 'title-input',
      label: '제목 입력',
      icon: <BookOpen className="h-6 w-6" />
    },
    {
      id: 'saving',
      label: '저장 중',
      icon: <Save className="h-6 w-6" />
    },
    {
      id: 'complete',
      label: '생성 완료',
      icon: <Check className="h-6 w-6" />
    }
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['extracting', 'text-review', 'generating', 'quiz-review', 'title-input', 'saving', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  // Only show loading spinner for processing steps
  const isProcessingStep = (stepId: string) => {
    return ['extracting', 'generating', 'saving'].includes(stepId);
  };

  // User interaction steps should just show as "ready"
  const isUserStep = (stepId: string) => {
    return ['text-review', 'quiz-review', 'title-input'].includes(stepId);
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">퀴즈 생성 진행 상황</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              전체 진행률: {progress}%
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="relative">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full transition-all shrink-0",
                        status === 'complete' && "bg-primary text-primary-foreground",
                        status === 'active' && isProcessingStep(step.id) && "bg-primary/20 text-primary animate-pulse",
                        status === 'active' && isUserStep(step.id) && "bg-primary text-primary-foreground",
                        status === 'pending' && "bg-muted text-muted-foreground"
                      )}
                    >
                      {status === 'complete' ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : status === 'active' && isProcessingStep(step.id) ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        step.icon
                      )}
                    </div>

                    {/* Label */}
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium transition-colors",
                          status === 'complete' && "text-foreground",
                          status === 'active' && "text-primary font-semibold",
                          status === 'pending' && "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </p>
                      {status === 'active' && isProcessingStep(step.id) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          처리 중입니다...
                        </p>
                      )}
                      {status === 'active' && isUserStep(step.id) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          확인이 필要합니다
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-6 w-0.5 h-6 transition-colors",
                        status === 'complete' ? "bg-primary" : "bg-muted"
                      )}
                      style={{ top: '48px' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
