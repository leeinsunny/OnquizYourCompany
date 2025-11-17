# OnQuiz – 온보딩 자동화 서비스

**OnQuiz는 회사의 온보딩 자료 업로드부터 자동 퀴즈 생성, 역할 기반 대시보드까지 제공하는 웹 기반 온보딩 자동화 플랫폼입니다.**  
문서 정리, 퀴즈 제작, 교육 진행 상황 관리 등 반복되는 온보딩 업무를 간편하게 처리할 수 있도록 설계되었습니다.

현재 아래 주소에서 운영 중입니다:

- 서비스 주소: https://onquizyourcompany.com  
- GitHub 저장소: https://github.com/leeinsunny/OnquizYourCompany

---

## 1. 기술 스택

### Frontend
- React (TypeScript)
- Vite
- Tailwind CSS
- shadcn-ui
- Zustand (상태 관리)
- React Router

### Backend / Infra (Supabase 기반)
- Supabase Auth (이메일/비밀번호 기반 인증)
- Supabase Database (PostgreSQL)
- Supabase Row-Level Security 정책(RLS)
- Supabase Storage (문서 업로드 관리)
- Supabase Edge Functions (백엔드 로직)
- PDF/PPT 텍스트 추출 및 구조화 모듈
- 퀴즈 자동 생성 LLM 연동

### Deployment
- 정적 프론트엔드: 자체 도메인 https://onquizyourcompany.com 에 배포
- 백엔드 및 DB: Supabase (호스팅 + 인증 + Storage + Functions)
- HTTPS/도메인 연결 완료

---

## 2.주요 기능

### 1. 온보딩 자료 업로드
- PDF, PPT 등 업로드 후 자동 텍스트 추출
- 추출된 텍스트를 기반으로 퀴즈 자동 생성

### 2. 자동 퀴즈 생성
- 자료에서 핵심 문장을 식별하여 문항 구성
- 단답형, 객관식, OX 등 다양한 형태 지원

### 3. 역할 기반 대시보드
- 관리자(Admin): 회사 전체 온보딩 현황
- 팀장(Manager): 팀 단위 온보딩/퀴즈 현황
- 사원(Employee): 자신의 온보딩 진행 및 할당된 퀴즈

### 4. 진행 상황 추적
- 퀴즈 완료율, 팀/부서별 진행 현황, 최근 활동 로그 확인

---

## 3. 프로젝트 구조

    src/
     ├─ components/    
     ├─ pages/          # Admin / Manager / Employee UI
     ├─ hooks/
     ├─ lib/            # Supabase 클라이언트, API, 유틸
     ├─ store/          # Zustand 전역 상태
     ├─ styles/
     └─ main.tsx

Supabase 관련 설정은 다음과 같이 구성됩니다:

    src/lib/supabaseClient.ts      # Supabase 인스턴스
    src/lib/auth.ts                # 로그인/회원정보 관리
    src/lib/storage.ts             # 문서 업로드/다운로드
    src/lib/db.ts                  # 각종 테이블 액세스

---

## 4. 환경 변수 (.env)

루트에 `.env` 파일을 생성하고 다음 값을 입력합니다.

    VITE_SUPABASE_URL=<your-supabase-url>
    VITE_SUPABASE_ANON_KEY=<your-anon-key>

    # (옵션) 외부 LLM 호출용
    VITE_OPENAI_API_KEY=<your-key>

---

## 5. 로컬 개발

### 1. 저장소 클론
    git clone https://github.com/leeinsunny/OnquizYourCompany
    cd OnquizYourCompany

### 2. 패키지 설치
    npm install

### 3. 개발 서버 실행
    npm run dev

브라우저에서 다음 주소로 실행됩니다:

    http://localhost:5173

---

## 6. 기능 개발 가이드

- 역할 기반 라우팅은 로그인 시 가져오는 `role` 값에 따라 처리됩니다.
- Supabase Auth의 세션 관리는 Zustand를 통해 전역적으로 관리합니다.
- 페이지 권한은 다음 기준으로 분기합니다:
  - admin → /admin
  - manager → /manager
  - employee → /employee
- 문서 업로드는 Supabase Storage에 저장되며 서버 처리 후 DB 레코드가 생성됩니다.
- 퀴즈 생성은 Edge Function 또는 외부 LLM API로 처리합니다.

---

## 7. 보안 및 정책

- 모든 데이터는 Supabase RLS(Row Level Security) 정책으로 보호됩니다.
- 각 역할(role)에 맞는 권한 규칙이 DB 단에도 적용됩니다.
- 파일 업로드는 Storage 정책에 따라 사용자별 권한이 분리됩니다.

