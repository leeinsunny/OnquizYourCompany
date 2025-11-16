-- Function to restrict file reads to approved documents in user's company
CREATE OR REPLACE FUNCTION public.can_read_document_object(_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.file_url = _name
      AND d.company_id = get_user_company_id(auth.uid())
      AND d.status = 'approved'
  );
END;
$$;

-- Allow members to read only approved document files in their company
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Members can read approved document files'
  ) THEN
    CREATE POLICY "Members can read approved document files"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'documents'
      AND public.can_read_document_object(name)
    );
  END IF;
END $$;