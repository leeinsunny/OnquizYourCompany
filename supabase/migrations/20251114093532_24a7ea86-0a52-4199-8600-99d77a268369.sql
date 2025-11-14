-- 트리거가 없는 상태이므로, auth.users 생성 시 handle_new_user를 실행하도록 트리거 추가
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  user_domain text;
  user_company_id uuid;
  user_name text;
  user_department text;
  user_job_title text;
  user_role app_role;
  is_first_user boolean;
  user_department_id uuid;
begin
  user_email := NEW.email;
  user_domain := split_part(user_email, '@', 2);
  user_name := coalesce(NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
  user_department := NEW.raw_user_meta_data->>'department';
  user_job_title := NEW.raw_user_meta_data->>'job_title';

  select id into user_company_id from public.companies where domain = user_domain;

  if user_company_id is null then
    insert into public.companies (name, domain)
    values (user_domain, user_domain)
    returning id into user_company_id;
    is_first_user := true;
  else
    select not exists (select 1 from public.profiles where company_id = user_company_id)
    into is_first_user;
  end if;

  if is_first_user then
    user_role := 'super_admin';
  else
    case user_job_title
      when '부장' then user_role := 'admin';
      when '이사' then user_role := 'admin';
      when '본부장' then user_role := 'admin';
      when '과장' then user_role := 'manager';
      when '차장' then user_role := 'manager';
      when '팀장' then user_role := 'manager';
      else user_role := 'member';
    end case;
  end if;

  if user_department is not null and user_department <> '' then
    select id into user_department_id from public.departments
    where company_id = user_company_id and name = user_department;

    if user_department_id is null then
      insert into public.departments (company_id, name)
      values (user_company_id, user_department)
      returning id into user_department_id;
    end if;
  end if;

  insert into public.user_roles (user_id, role, scope, scope_id)
  values (NEW.id, user_role, 'company', user_company_id);

  insert into public.profiles (id, company_id, email, name, department_id, job_title)
  values (NEW.id, user_company_id, user_email, user_name, user_department_id, user_job_title);

  return NEW;
end;$$;

-- auth.users 트리거 생성 (존재하지 않을 경우)
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();