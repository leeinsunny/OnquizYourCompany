import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuizTitleDialogProps {
  open: boolean;
  defaultTitle: string;
  onConfirm: (title: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const QuizTitleDialog = ({
  open,
  defaultTitle,
  onConfirm,
  onCancel,
  isLoading = false
}: QuizTitleDialogProps) => {
  const [title, setTitle] = useState(defaultTitle);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isLoading && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>퀴즈 제목 입력</DialogTitle>
          <DialogDescription>
            생성된 퀴즈의 제목을 입력하세요. 이 제목으로 퀴즈가 저장됩니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quiz-title">퀴즈 제목</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 회사 소개 및 문화 퀴즈"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim() && !isLoading) {
                  onConfirm(title);
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
          <Button 
            onClick={() => onConfirm(title)}
            disabled={!title.trim() || isLoading}
          >
            {isLoading ? "저장 중..." : "완료"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
