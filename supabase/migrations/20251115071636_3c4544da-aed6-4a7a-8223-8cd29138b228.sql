-- Add INSERT policies for quiz_questions table
CREATE POLICY "Admins can insert quiz questions"
ON public.quiz_questions
FOR INSERT
TO authenticated
WITH CHECK (
  quiz_id IN (
    SELECT quizzes.id
    FROM quizzes
    WHERE quizzes.company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Add UPDATE and DELETE policies for quiz_questions
CREATE POLICY "Admins can update quiz questions"
ON public.quiz_questions
FOR UPDATE
TO authenticated
USING (
  quiz_id IN (
    SELECT quizzes.id
    FROM quizzes
    WHERE quizzes.company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  )
);

CREATE POLICY "Admins can delete quiz questions"
ON public.quiz_questions
FOR DELETE
TO authenticated
USING (
  quiz_id IN (
    SELECT quizzes.id
    FROM quizzes
    WHERE quizzes.company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Add INSERT policy for quiz_options table
CREATE POLICY "Admins can insert quiz options"
ON public.quiz_options
FOR INSERT
TO authenticated
WITH CHECK (
  question_id IN (
    SELECT qz.id
    FROM quiz_questions qz
    JOIN quizzes q ON qz.quiz_id = q.id
    WHERE q.company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  )
);

-- Add UPDATE and DELETE policies for quiz_options
CREATE POLICY "Admins can update quiz options"
ON public.quiz_options
FOR UPDATE
TO authenticated
USING (
  question_id IN (
    SELECT qz.id
    FROM quiz_questions qz
    JOIN quizzes q ON qz.quiz_id = q.id
    WHERE q.company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  )
);

CREATE POLICY "Admins can delete quiz options"
ON public.quiz_options
FOR DELETE
TO authenticated
USING (
  question_id IN (
    SELECT qz.id
    FROM quiz_questions qz
    JOIN quizzes q ON qz.quiz_id = q.id
    WHERE q.company_id IN (
      SELECT profiles.company_id
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  )
  AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  )
);