-- 1) Documents 권한: manager도 관리 가능하게 정책 추가
-- (admins 정책은 그대로 유지)
CREATE POLICY "Managers can manage documents"
ON public.documents
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  (company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  ))
  AND has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  (company_id IN (
    SELECT profiles.company_id FROM public.profiles WHERE profiles.id = auth.uid()
  ))
  AND has_role(auth.uid(), 'manager'::app_role)
);

-- 2) Storage policies for 'documents' bucket
-- 업로드(INSERT)
CREATE POLICY "Admins & Managers can upload documents"
ON storage.objects
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id::text = (storage.foldername(name))[1]
  )
);

-- 읽기(SELECT)
CREATE POLICY "Admins & Managers can read documents"
ON storage.objects
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id::text = (storage.foldername(name))[1]
  )
);

-- 삭제(DELETE)
CREATE POLICY "Admins & Managers can delete documents"
ON storage.objects
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  )
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id::text = (storage.foldername(name))[1]
  )
);
