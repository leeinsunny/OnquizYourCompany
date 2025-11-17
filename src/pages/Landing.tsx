import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Upload, FileCheck, Users } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const coreValues = [
    {
      icon: Upload,
      title: "자료 업로드만 하면 자동 생성",
      description: "기존 문서로 퀴즈를 자동으로 만듭니다",
    },
    {
      icon: Users,
      title: "팀·부서 단위 진행 상황 확인",
      description: "실시간으로 학습 현황을 파악합니다",
    },
    {
      icon: FileCheck,
      title: "일관된 온보딩 자료 제공",
      description: "모든 신입사원에게 동일한 교육을 제공합니다",
    },
  ];

  const features = [
    {
      title: "자료 업로드",
      description: "PDF, PPT 파일을 드래그 앤 드롭",
    },
    {
      title: "자동 퀴즈 생성",
      description: "AI가 핵심 내용을 추출해 퀴즈 생성",
    },
    {
      title: "진행 현황 추적",
      description: "팀별 완료율과 점수 확인",
    },
    {
      title: "권한 기반 접근",
      description: "관리자·팀장·사원별 권한 관리",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "자료 업로드",
      description: "온보딩 문서 업로드",
    },
    {
      number: "02",
      title: "자동 분석",
      description: "AI가 내용 분석 및 퀴즈 생성",
    },
    {
      number: "03",
      title: "퀴즈 진행",
      description: "신입사원 학습 시작",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              OnQuiz
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              로그인
            </Button>
            <Button onClick={() => navigate("/login")} className="shadow-lg hover:shadow-xl transition-shadow">
              시작하기
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-20 relative bg-gradient-to-br from-primary via-primary/90 to-secondary">
        <div className="container mx-auto flex max-w-4xl flex-col items-center gap-8 text-center px-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-primary-foreground leading-relaxed">
            번거로웠던 우리의 온보딩,<br />
            이제 효율과 효과가 좋아집니다
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-primary-foreground/90 leading-relaxed">
            기존 교육 자료만 있으면 됩니다.<br />
            퀴즈 생성부터 진행 추적까지 자동으로 처리해보세요.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/login")}
            className="shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            시작하기
          </Button>
        </div>
      </section>

      {/* Core Value Section */}
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-3">
            {coreValues.map((value, index) => (
              <Card
                key={index}
                className="border-muted shadow-card hover:shadow-hover transition-all hover:-translate-y-1"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="container py-16 md:py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              주요 기능
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="shadow-card hover:shadow-hover transition-all hover:-translate-y-1 bg-gradient-card"
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              사용 방법
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card
                key={index}
                className="text-center shadow-card hover:shadow-hover transition-all hover:-translate-y-1"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 text-4xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">
                    {step.number}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="container py-16 md:py-20">
        <Card className="bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-2xl border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center relative z-10">
            <h2 className="text-2xl font-bold md:text-3xl">온보딩을 자동화하세요</h2>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/login")}
              className="shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              시작하기
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container text-center text-sm text-muted-foreground">© 2025 OnQuiz. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default Landing;
