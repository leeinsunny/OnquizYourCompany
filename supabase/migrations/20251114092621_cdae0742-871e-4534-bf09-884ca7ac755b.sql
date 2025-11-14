-- 기존 handle_new_user 함수를 수정하여 직급에 따라 역할을 자동 할당
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  user_domain TEXT;
  user_company_id UUID;
  user_name TEXT;
  user_department TEXT;
  user_job_title TEXT;
  user_role app_role;
  is_first_user BOOLEAN;
BEGIN
  -- 이메일에서 정보 추출
  user_email := NEW.email;
  user_domain := split_part(user_email, '@', 2);
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
  user_department := NEW.raw_user_meta_data->>'department';
  user_job_title := NEW.raw_user_meta_data->>'job_title';
  
  -- 회사 찾기 또는 생성
  SELECT id INTO user_company_id
  FROM public.companies
  WHERE domain = user_domain;
  
  IF user_company_id IS NULL THEN
    -- 새 회사 생성
    INSERT INTO public.companies (name, domain)
    VALUES (user_domain, user_domain)
    RETURNING id INTO user_company_id;
    
    is_first_user := TRUE;
  ELSE
    -- 기존 회사에 사용자가 있는지 확인
    SELECT NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE company_id = user_company_id
    ) INTO is_first_user;
  END IF;
  
  -- 역할 결정
  IF is_first_user THEN
    -- 회사의 첫 번째 사용자는 super_admin
    user_role := 'super_admin';
  ELSE
    -- 직급에 따라 역할 할당
    CASE user_job_title
      WHEN '부장', '이사', '본부장' THEN
        user_role := 'admin';
      WHEN '과장', '차장', '팀장' THEN
        user_role := 'manager';
      ELSE
        user_role := 'member';
    END CASE;
  END IF;
  
  -- 역할 할당
  INSERT INTO public.user_roles (user_id, role, scope, scope_id)
  VALUES (NEW.id, user_role, 'company', user_company_id);
  
  -- 부서 찾기 또는 생성
  DECLARE
    user_department_id UUID;
  BEGIN
    IF user_department IS NOT NULL AND user_department != '' THEN
      -- 기존 부서 찾기
      SELECT id INTO user_department_id
      FROM public.departments
      WHERE company_id = user_company_id AND name = user_department;
      
      -- 부서가 없으면 생성
      IF user_department_id IS NULL THEN
        INSERT INTO public.departments (company_id, name)
        VALUES (user_company_id, user_department)
        RETURNING id INTO user_department_id;
      END IF;
    END IF;
    
    -- 프로필 생성
    INSERT INTO public.profiles (id, company_id, email, name, department_id, job_title)
    VALUES (NEW.id, user_company_id, user_email, user_name, user_department_id, user_job_title);
  END;
  
  RETURN NEW;
END;
$function$;