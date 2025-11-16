import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTitle: string;
  hasQuizzes: boolean;
  onConfirm: () => void;
}

export const DeleteDocumentDialog = ({
  open,
  onOpenChange,
  documentTitle,
  hasQuizzes,
  onConfirm
}: DeleteDocumentDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDialogTitle>문서 삭제 확인</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2 pt-2">
            <p>
              <span className="font-semibold">{documentTitle}</span> 문서를 삭제하시겠습니까?
            </p>
            {hasQuizzes && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mt-3">
                <p className="text-destructive font-medium">
                  ⚠️ 경고: 이 문서와 연결된 퀴즈가 있습니다.
                </p>
                <p className="text-sm text-destructive/90 mt-1">
                  문서를 삭제하면 연결된 모든 퀴즈와 퀴즈 문제도 함께 삭제됩니다.
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
