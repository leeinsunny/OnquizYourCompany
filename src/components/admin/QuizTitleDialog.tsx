import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

interface CategoryPath {
  displayPath: string;
  levels: {
    level1: string;
    level2: string;
    level3: string;
  };
  slugPath: string[];
}

interface QuizTitleDialogProps {
  open: boolean;
  defaultTitle: string;
  documentId: string;
  documentTitle: string;
  documentText: string;
  onConfirm: (title: string, category: CategoryPath | null) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const QuizTitleDialog = ({
  open,
  defaultTitle,
  documentId,
  documentTitle,
  documentText,
  onConfirm,
  onCancel,
  isLoading = false
}: QuizTitleDialogProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [suggestedCategories, setSuggestedCategories] = useState<CategoryPath[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showCategoryEdit, setShowCategoryEdit] = useState(false);
  const [customCategory, setCustomCategory] = useState({
    level1: "",
    level2: "",
    level3: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && defaultTitle) {
      setTitle(defaultTitle);
      setSuggestedCategories([]);
      setSelectedCategory("");
      setShowCategoryEdit(false);
      setCustomCategory({ level1: "", level2: "", level3: "" });
    }
  }, [defaultTitle, open]);

  const handleSuggestCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-categories', {
        body: {
          company_name: "회사명",
          onboarding_document_title: documentTitle,
          quiz_title: title,
          onboarding_document_plaintext: documentText,
        }
      });

      if (error) throw error;

      if (data?.suggested_category_paths && Array.isArray(data.suggested_category_paths)) {
        setSuggestedCategories(data.suggested_category_paths);
        setSelectedCategory("0");
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error suggesting categories:', error);
      toast({
        title: "카테고리 추천 실패",
        description: error.message || "카테고리를 추천하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleConfirm = () => {
    let selectedCategoryData: CategoryPath | null = null;

    if (showCategoryEdit) {
      if (customCategory.level1 && customCategory.level2 && customCategory.level3) {
        selectedCategoryData = {
          displayPath: `${customCategory.level1} > ${customCategory.level2} > ${customCategory.level3}`,
          levels: customCategory,
          slugPath: [
            customCategory.level1.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            customCategory.level2.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            customCategory.level3.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          ]
        };
      }
    } else if (selectedCategory && suggestedCategories.length > 0) {
      const index = parseInt(selectedCategory);
      selectedCategoryData = suggestedCategories[index];
    }

    onConfirm(title, selectedCategoryData);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isLoading && onCancel()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>퀴즈 제목 및 카테고리 설정</DialogTitle>
          <DialogDescription>
            생성된 퀴즈의 제목과 카테고리를 설정하세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Quiz Title */}
          <div className="space-y-2">
            <Label htmlFor="quiz-title">퀴즈 제목</Label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 회사 소개 및 문화 퀴즈"
              disabled={isLoading}
            />
          </div>

          {/* Category Suggestion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>카테고리 (선택사항)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSuggestCategories}
                disabled={isLoadingCategories || isLoading || !documentText}
              >
                {isLoadingCategories ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    추천 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI 카테고리 추천
                  </>
                )}
              </Button>
            </div>

            {/* Suggested Categories */}
            {suggestedCategories.length > 0 && !showCategoryEdit && (
              <div className="space-y-3">
                <RadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
                  {suggestedCategories.map((category, index) => (
                    <div key={index} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50">
                      <RadioGroupItem value={index.toString()} id={`category-${index}`} className="mt-1" />
                      <Label htmlFor={`category-${index}`} className="flex-1 cursor-pointer font-normal">
                        <div className="font-medium text-sm mb-1">{category.displayPath}</div>
                        <div className="text-xs text-muted-foreground">
                          {category.levels.level1} → {category.levels.level2} → {category.levels.level3}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCategoryEdit(true)}
                >
                  직접 입력하기
                </Button>
              </div>
            )}

            {/* Custom Category Input */}
            {showCategoryEdit && (
              <div className="space-y-3 rounded-lg border p-4 bg-accent/30">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">직접 입력</Label>
                  {suggestedCategories.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCategoryEdit(false)}
                    >
                      추천 목록으로 돌아가기
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level1" className="text-xs">대카테고리</Label>
                  <Input
                    id="level1"
                    value={customCategory.level1}
                    onChange={(e) => setCustomCategory({ ...customCategory, level1: e.target.value })}
                    placeholder="예: 인사/복지"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level2" className="text-xs">중카테고리</Label>
                  <Input
                    id="level2"
                    value={customCategory.level2}
                    onChange={(e) => setCustomCategory({ ...customCategory, level2: e.target.value })}
                    placeholder="예: 복리후생 제도"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level3" className="text-xs">소카테고리</Label>
                  <Input
                    id="level3"
                    value={customCategory.level3}
                    onChange={(e) => setCustomCategory({ ...customCategory, level3: e.target.value })}
                    placeholder="예: 연차/휴가 규정"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Prompt to suggest categories */}
            {suggestedCategories.length === 0 && !showCategoryEdit && (
              <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/30">
                AI 카테고리 추천 버튼을 눌러 3가지 카테고리를 추천받거나{' '}
                <button
                  type="button"
                  className="text-primary underline hover:no-underline"
                  onClick={() => setShowCategoryEdit(true)}
                >
                  직접 입력
                </button>
                할 수 있습니다.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!title.trim() || isLoading}
          >
            {isLoading ? "저장 중..." : "완료"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
