import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Loader2, FileText, Sparkles, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface QuizGenerationProgressModalProps {
  open: boolean;
  currentStep: 'cleaning' | 'generating' | 'complete';
  progress: number;
}

export const QuizGenerationProgressModal = ({
  open,
  currentStep,
  progress
}: QuizGenerationProgressModalProps) => {
  const steps: Step[] = [
    {
      id: 'cleaning',
      label: '텍스트 정리 중',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 'generating',
      label: '퀴즈 생성 중',
      icon: <Sparkles className="h-6 w-6" />
    },
    {
      id: 'complete',
      label: '생성 완료',
      icon: <BookOpen className="h-6 w-6" />
    }
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['cleaning', 'generating', 'complete'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <Dialog open={open}>
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center">퀴즈 생성 중</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 py-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {progress}% 완료
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              
              return (
                <div key={step.id} className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full transition-all",
                      status === 'complete' && "bg-primary text-primary-foreground",
                      status === 'active' && "bg-primary/20 text-primary animate-pulse",
                      status === 'pending' && "bg-muted text-muted-foreground"
                    )}
                  >
                    {status === 'complete' ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : status === 'active' ? (
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
                        status === 'active' && "text-primary",
                        status === 'pending' && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </p>
                    {status === 'active' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        잠시만 기다려주세요...
                      </p>
                    )}
                  </div>

                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-6 h-8 w-0.5 transition-colors",
                        "mt-16",
                        status === 'complete' ? "bg-primary" : "bg-muted"
                      )}
                      style={{ top: `${index * 80 + 140}px` }}
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
