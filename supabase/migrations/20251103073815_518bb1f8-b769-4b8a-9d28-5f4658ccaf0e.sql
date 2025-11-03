-- OnQuiz 데이터베이스 스키마

-- 회사 테이블
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 부서 테이블
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, name)
);

-- 사용자 프로필 테이블
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  job_title TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 사용자 역할 ENUM
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'member');

-- 사용자 역할 테이블
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  scope TEXT, -- 'company', 'department', 'team' 등
  scope_id UUID, -- company_id 또는 department_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role, scope, scope_id)
);

-- 역할 확인 함수
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 온보딩 문서 테이블
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'processing', -- processing, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 카테고리 테이블
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 퀴즈 테이블
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER, -- 초 단위
  pass_score INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 퀴즈 문항 테이블
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'multiple_choice', -- multiple_choice, true_false
  order_index INTEGER DEFAULT 0,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 퀴즈 선택지 테이블
CREATE TABLE public.quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  explanation TEXT
);

-- 퀴즈 할당 테이블
CREATE TABLE public.quiz_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id) NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(quiz_id, user_id)
);

-- 퀴즈 응시 기록 테이블
CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER,
  total_points INTEGER,
  percentage DECIMAL(5, 2),
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, abandoned
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER -- 초 단위
);

-- 퀴즈 응답 테이블
CREATE TABLE public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.quiz_options(id) ON DELETE CASCADE,
  is_correct BOOLEAN,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 정책 활성화
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

-- 프로필 RLS 정책
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 회사 RLS 정책
CREATE POLICY "Users can view their company"
ON public.companies FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 부서 RLS 정책
CREATE POLICY "Users can view departments in their company"
ON public.departments FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 문서 RLS 정책
CREATE POLICY "Admins can manage documents"
ON public.documents FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Members can view approved documents"
ON public.documents FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND status = 'approved'
);

-- 퀴즈 RLS 정책
CREATE POLICY "Admins can manage quizzes"
ON public.quizzes FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
);

CREATE POLICY "Members can view active quizzes"
ON public.quizzes FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  ) AND is_active = true
);

-- 퀴즈 문항 RLS 정책
CREATE POLICY "Users can view quiz questions"
ON public.quiz_questions FOR SELECT
TO authenticated
USING (
  quiz_id IN (
    SELECT id FROM public.quizzes
    WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- 퀴즈 선택지 RLS 정책
CREATE POLICY "Users can view quiz options"
ON public.quiz_options FOR SELECT
TO authenticated
USING (
  question_id IN (
    SELECT qz.id FROM public.quiz_questions qz
    JOIN public.quizzes q ON qz.quiz_id = q.id
    WHERE q.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- 퀴즈 할당 RLS 정책
CREATE POLICY "Users can view their assignments"
ON public.quiz_assignments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage assignments"
ON public.quiz_assignments FOR ALL
TO authenticated
USING (
  quiz_id IN (
    SELECT id FROM public.quizzes q
    WHERE q.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  ) AND (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
);

-- 퀴즈 응시 기록 RLS 정책
CREATE POLICY "Users can view their own attempts"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own attempts"
ON public.quiz_attempts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attempts"
ON public.quiz_attempts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all attempts"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (
  quiz_id IN (
    SELECT id FROM public.quizzes q
    WHERE q.company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  ) AND (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'manager')
  )
);

-- 퀴즈 응답 RLS 정책
CREATE POLICY "Users can manage their own answers"
ON public.quiz_answers FOR ALL
TO authenticated
USING (
  attempt_id IN (
    SELECT id FROM public.quiz_attempts WHERE user_id = auth.uid()
  )
);

-- 프로필 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_domain TEXT;
  user_company_id UUID;
  user_name TEXT;
BEGIN
  -- 이메일에서 정보 추출
  user_email := NEW.email;
  user_domain := split_part(user_email, '@', 2);
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
  
  -- 회사 찾기 또는 생성
  SELECT id INTO user_company_id
  FROM public.companies
  WHERE domain = user_domain;
  
  IF user_company_id IS NULL THEN
    -- 새 회사 생성
    INSERT INTO public.companies (name, domain)
    VALUES (user_domain, user_domain)
    RETURNING id INTO user_company_id;
    
    -- 첫 번째 사용자를 super_admin으로 설정
    INSERT INTO public.user_roles (user_id, role, scope, scope_id)
    VALUES (NEW.id, 'super_admin', 'company', user_company_id);
  ELSE
    -- 기존 회사의 경우 member로 설정
    INSERT INTO public.user_roles (user_id, role, scope, scope_id)
    VALUES (NEW.id, 'member', 'company', user_company_id);
  END IF;
  
  -- 프로필 생성
  INSERT INTO public.profiles (id, company_id, email, name)
  VALUES (NEW.id, user_company_id, user_email, user_name);
  
  RETURN NEW;
END;
$$;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 업데이트 트리거
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();