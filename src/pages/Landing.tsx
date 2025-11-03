import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  Brain, 
  Users, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Upload,
      title: "간편한 자료 업로드",
      description: "PDF, PPT 등 기존 온보딩 문서를 업로드하면 AI가 자동으로 분석합니다."
    },
    {
      icon: Brain,
      title: "AI 자동 퀴즈 생성",
      description: "업로드한 자료에서 핵심 내용을 추출하여 맞춤형 퀴즈를 자동 생성합니다."
    },
    {
      icon: Users,
      title: "팀별 맞춤 관리",
      description: "부서별, 팀별로 퀴즈를 할당하고 진행 상황을 실시간으로 추적합니다."
    },
    {
      icon: BarChart3,
      title: "상세한 분석 리포트",
      description: "신입사원의 학습 진도와 이해도를 한눈에 파악할 수 있습니다."
    },
    {
      icon: Shield,
      title: "권한 기반 접근",
      description: "회사 관리자, 부서 관리자, 팀 리더별 권한을 세밀하게 설정합니다."
    },
    {
      icon: Zap,
      title: "빠른 온보딩",
      description: "신입사원이 필요한 지식을 빠르고 효과적으로 습득할 수 있습니다."
    }
  ];

  const benefits = [
    "온보딩 시간을 50% 단축",
    "학습 효율성 3배 향상",
    "관리자 업무 부담 감소",
    "체계적인 지식 전달"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero" />
            <span className="text-xl font-bold">OnQuiz</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              로그인
            </Button>
            <Button onClick={() => navigate("/signup")}>
              시작하기
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
            <Zap className="mr-2 h-4 w-4 text-primary" />
            <span>AI 기반 온보딩 솔루션</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            신입사원 온보딩을
            <br />
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              더 스마트하게
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            OnQuiz는 AI를 활용해 기업의 온보딩 자료를 체계화하고
            <br className="hidden sm:inline" />
            퀴즈를 자동 생성·관리하는 플랫폼입니다
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" onClick={() => navigate("/signup")} className="gap-2">
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              데모 보기
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-8 pt-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              주요 기능
            </h2>
            <p className="text-lg text-muted-foreground">
              OnQuiz가 제공하는 강력한 기능들을 확인해보세요
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="transition-all hover:shadow-hover">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-16 md:py-24 bg-muted/50">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              어떻게 작동하나요?
            </h2>
            <p className="text-lg text-muted-foreground">
              간단한 3단계로 시작하세요
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "자료 업로드",
                description: "기존 온보딩 문서를 드래그 앤 드롭으로 업로드합니다"
              },
              {
                step: "02",
                title: "AI 분석",
                description: "AI가 자동으로 내용을 분석하고 퀴즈를 생성합니다"
              },
              {
                step: "03",
                title: "퀴즈 할당",
                description: "신입사원에게 퀴즈를 할당하고 진행 상황을 추적합니다"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="mb-4 text-5xl font-bold text-primary/20">
                  {item.step}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16 md:py-24">
        <Card className="bg-gradient-hero text-white">
          <CardContent className="flex flex-col items-center gap-6 py-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              지금 바로 시작하세요
            </h2>
            <p className="max-w-2xl text-lg opacity-90">
              OnQuiz로 신입사원 온보딩을 혁신하고
              <br />
              효율적인 학습 경험을 제공하세요
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/signup")}
              className="gap-2"
            >
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-gradient-hero" />
            <span className="font-semibold">OnQuiz</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 OnQuiz. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
