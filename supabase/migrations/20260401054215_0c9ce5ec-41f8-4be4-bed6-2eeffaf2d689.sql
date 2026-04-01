
CREATE TABLE public.user_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  note_date DATE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_notes_user_date_idx ON public.user_notes (user_id, note_date);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notes"
  ON public.user_notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
