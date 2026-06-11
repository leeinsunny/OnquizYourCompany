import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Users,
  FileText,
  Calendar,
  ClipboardCheck,
  ArrowRight,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react";

const OnboardingChecklist = () => {
  const navigate = useNavigate();

  const preFirstDay = [
    "입사 계약서 및 필수 서류 사전 전송",
    "업무용 이메일, 노트북, 사원증 준비",
    "오리엔테이션 일정 공유",
    "담당 멘토 및 팀 구성원 소개",
    "출입증 및 보안접근 권한 설정",
  ];

  const firstDay = [
    "회사 소개 및 조직 문화 안내",
    "업무 환경 소개(사무실, 주차, 식당 등)",
    "IT 장비 세팅 및 계정 생성 지원",
    "필수 정책 및 규정 안내",
    "첫날 오리엔테이션 퀴즈 진행",
  ];

  const firstWeek = [
    "팀별 업무 프로세스 교육",
    "핵심 업무 도구 사용법 안내",
    "1:1 멘토링 미팅 설정",
    "단기 학습 목표 수립",
    "주간 체크인 퀴즈로 이해도 확인",
  ];

  const firstMonth = [
    "월간 목표 달성도 점검",
    "피드백 세션 및 개선점 도출",
    "팀 프로젝트 참여 시작",
    "고급 업무 교육 진행",
    "월간 퀴즈로 지식 습득 확인",
  ];

  const bestPractices = [
    {
      icon: ClipboardCheck,
      title: "구조화된 체크리스트 작성",
      description:
        "단계별로 명확하게 나눈 체크리스트는 신입사원과 HR 모두에게 clarity를 제공합니다. 서류 준비 → 첫날 → 1주차 → 1개월 단위로 구분하세요.",
    },
    {
      icon: Users,
      title: "멘토 제도 운영",
      description:
        "담당 멘토를 배정하면 신입사원의 적응 속도가 2배 이상 빨라집니다. 정기적인 1:1 미팅 일정을 체크리스트에 포함하세요.",
    },
    {
      icon: BookOpen,
      title: "학습 자료 체계화",
      description:
        "회사 소개, 조직 문화, 업무 프로세스 등 핵심 자료를 한 곳에 모아두세요. 체계화된 자료는 반복적인 설명 시간을 줄여줍니다.",
    },
    {
      icon: Award,
      title: "퀴즈로 지식 확인",
      description:
        "단순히 자료를 읽게 하는 것보다, 퀴즈를 통해 실제 이해도를 확인하는 것이 효과적입니다. OnQuiz로 자동 퀴즈를 만들어보세요.",
    },
  ];

  const faqs = [
    {
      q: "온보딩 체크리스트는 필수인가요?",
      a: "법률상 의무는 아니지만, 체계적인 온보딩은 신입사원의 이직률을 50% 이상 감소시키고, 적응 기간을 단축시키는 효과가 입증되었습니다.",
    },
    {
      q: "체크리스트 작성은 누가 하나요?",
      a: "일반적으로 HR팀이 기본 틀을 작성하고, 각 팀장이 부서별 항목을 보완하는 방식으로 협업합니다. OnQuiz에서는 템플릿으로 빠르게 시작할 수 있습니다.",
    },
    {
      q: "퀴즈는 왜 포함하나요?",
      a: "자료를 제공했다고 해서 이해했다는 뜻은 아닙니다. 간단한 퀴즈를 통해 실제 학습 성과를 확인하고, 추가 교육이 필요한 부분을 파악할 수 있습니다.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Helmet>
        <title>신입사원 온보딩 체크리스트: 성공적인 적응을 위한 필수 가이드 | OnQuiz</title>
        <meta
          name="description"
          content="신입사원 온보딩 체크리스트 완벽 가이드. 첫날부터 한 달까지 단계별 체크리스트와 HR 전문가 팁. OnQuiz로 온보딩 퀴즈 자동화까지 한 번에 해결하세요."
        />
        <link
          rel="canonical"
          href="https://onquizyourcompany.com/resources/onboarding-checklist"
        />
        <meta property="og:title" content="신입사원 온보딩 체크리스트: 성공적인 적응을 위한 필수 가이드" />
        <meta
          property="og:description"
          content="신입사원 온보딩 체크리스트 완벽 가이드. 첫날부터 한 달까지 단계별 체크리스트와 HR 전문가 팁."
        />
        <meta
          property="og:url"
          content="https://onquizyourcompany.com/resources/onboarding-checklist"
        />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "신입사원 온보딩 체크리스트: 성공적인 적응을 위한 필수 가이드",
            description:
              "신입사원 온보딩 체크리스트 완벽 가이드. 첫날부터 한 달까지 단계별 체크리스트와 HR 전문가 팁.",
            url: "https://onquizyourcompany.com/resources/onboarding-checklist",
            author: { "@type": "Organization", name: "OnQuiz" },
            publisher: {
              "@type": "Organization",
              name: "OnQuiz",
              url: "https://onquizyourcompany.com/",
            },
          })}
        </script>
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OnQuiz
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              로그인
            </Button>
            <Button
              onClick={() => navigate("/login")}
              className="shadow-lg hover:shadow-xl transition-shadow"
            >
              시작하기
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20 bg-gradient-to-br from-primary via-primary/90 to-secondary">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-primary-foreground leading-relaxed">
            신입사원 온보딩 체크리스트
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            성공적인 적응을 위한 필수 가이드 — 첫날부터 한 달까지
            <br />
            HR 전문가가 추천하는 단계별 체크리스트
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/login")}
              className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              OnQuiz로 퀴즈 자동화하기
            </Button>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="container py-12 md:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-lg text-muted-foreground leading-relaxed">
            체계적인 <strong className="text-foreground">온보딩 체크리스트</strong>는
            신입사원의 조직 적응 성공률을 높이는 핵심 도구입니다. 이 가이드는
            입사 전 준비부터 한 달 후 점검까지, HR 전문가들이 실제 현장에서
            사용하는 단계별 체크리스트를 공유합니다. 각 단계별로 필요한
            항목을 확인하고, OnQuiz를 활용해 온보딩 교육의 마지막 조각인
            <strong> 지식 검증 자동화</strong>까지 완성해보세요.
          </p>
        </div>
      </section>

      {/* Phase 1: Pre First Day */}
      <section className="container py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Phase 1. 입사 전 준비</h2>
              <p className="text-sm text-muted-foreground">
                입사일 전 1~2주 — 신입사원이 마음의 준비를 할 수 있게 합니다
              </p>
            </div>
          </div>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {preFirstDay.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Phase 2: First Day */}
      <section className="container py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Phase 2. 첫날 오리엔테이션</h2>
              <p className="text-sm text-muted-foreground">
                입사 첫날 — 첫인상과 정보 습득의 가장 중요한 날입니다
              </p>
            </div>
          </div>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {firstDay.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Phase 3: First Week */}
      <section className="container py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Phase 3. 첫 주 적응</h2>
              <p className="text-sm text-muted-foreground">
                입사 1주차 — 업무에 본격적으로 참여하기 전 핵심 학습 기간입니다
              </p>
            </div>
          </div>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {firstWeek.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Phase 4: First Month */}
      <section className="container py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Phase 4. 한 달 성과 점검</h2>
              <p className="text-sm text-muted-foreground">
                입사 1개월 — 목표 달성도를 확인하고 장기 계획을 수립합니다
              </p>
            </div>
          </div>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {firstMonth.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Best Practices */}
      <section className="container py-16 md:py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              체크리스트 작성 팁
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              HR 전문가들이 실제 사용하는 온보딩 체크리스트 작성 노하우
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {bestPractices.map((tip, index) => (
              <Card
                key={index}
                className="shadow-card hover:shadow-hover transition-all hover:-translate-y-1"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <tip.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tip.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              자주 묻는 질문
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="pt-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                    {faq.q}
                  </h3>
                  <p className="text-sm text-muted-foreground pl-6">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 md:py-20">
        <Card className="bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-2xl border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center relative z-10">
            <h2 className="text-2xl font-bold md:text-3xl">
              체크리스트의 마지막 조각: 지식 검증 자동화
            </h2>
            <p className="max-w-xl text-primary-foreground/90">
              온보딩 자료를 준비했다면, 이제 퀴즈로 실제 이해도를 확인하세요.
              OnQuiz는 PDF, PPT 파일을 업로드하면 AI가 자동으로 퀴즈를
              생성해줍니다. 진행 상황도 실시간으로 추적할 수 있습니다.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/login")}
              className="shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              OnQuiz 무료 시작하기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025 OnQuiz. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default OnboardingChecklist;
