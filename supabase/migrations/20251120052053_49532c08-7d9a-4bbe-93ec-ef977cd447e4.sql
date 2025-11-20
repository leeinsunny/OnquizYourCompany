-- Add category columns to documents table
ALTER TABLE public.documents
ADD COLUMN category_level1 TEXT,
ADD COLUMN category_level2 TEXT,
ADD COLUMN category_level3 TEXT,
ADD COLUMN category_slug_path TEXT[];

-- Add comment for clarity
COMMENT ON COLUMN public.documents.category_level1 IS '대카테고리 (예: 인사/복지)';
COMMENT ON COLUMN public.documents.category_level2 IS '중카테고리 (예: 복리후생 제도)';
COMMENT ON COLUMN public.documents.category_level3 IS '소카테고리 (예: 연차/휴가 규정)';
COMMENT ON COLUMN public.documents.category_slug_path IS '카테고리 slug 경로 배열 (예: {hr_welfare, benefit_policy, annual_leave})';