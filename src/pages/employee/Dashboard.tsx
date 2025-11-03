import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Trophy,
  TrendingUp,
  Play,
  CheckCircle2,
  Clock,
  Award,
  LogOut
} from "lucide-react";

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const stats = {
    totalQuizzes: 10,
    completedQuizzes: 6,
    averageScore: 85,
    totalCategories: 5,
    completedCategories: 3
  };

  const completionRate = (stats.completedQuizzes / stats.totalQuizzes) * 100;

  const assignedQuizzes = [
    {
      title: "회사 소개 및 비전",
      category: "회사 정보",
      questions: 5,
      status: "completed",
      score: 90,
      timeSpent: "12분"
    },
    {
      title: "보안 규정 및 정책",
      category: "보안",
      questions: 8,
      status: "completed",
      score: 85,
      timeSpent: "18분"
    },
    {
      title: "복지 제도 안내",
      category: "복지",
      questions: 6,
      status: "in-progress",
      score: null,
      timeSpent: null
    },
    {
      title: "업무 도구 사용법",
      category: "IT",
      questions: 7,
      status: "not-started",
      score: null,
      timeSpent: null
    }
  ];

  const achievements = [
    { name: "첫 퀴즈 완료", icon: "🎯", earned: true },
    { name: "연속 3일 학습", icon: "🔥", earned: true },
    { name: "만점 달성", icon: "⭐", earned: false },
    { name: "전체 완료", icon: "🏆", earned: false }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero" />
            <span className="text-lg font-bold">OnQuiz</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost">홈</Button>
            <Button variant="ghost">온보딩 자료</Button>
            <Button variant="ghost">퀴즈</Button>
            <Button variant="ghost">학습 현황</Button>
          </nav>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 rounded-lg bg-gradient-hero p-8 text-white">
          <h1 className="mb-2 text-3xl font-bold">환영합니다, 김민수님! 👋</h1>
          <p className="text-lg opacity-90">
            첫 출근을 환영합니다. 온보딩 학습을 시작해보세요!
          </p>
        </div>

        {/* Progress Overview */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">할당된 퀴즈</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.completedQuizzes}/{stats.totalQuizzes}
                  </p>
                </div>
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <Progress value={completionRate} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">평균 점수</p>
                  <p className="mt-1 text-2xl font-bold">{stats.averageScore}점</p>
                </div>
                <Trophy className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">완료한 카테고리</p>
                  <p className="mt-1 text-2xl font-bold">
                    {stats.completedCategories}/{stats.totalCategories}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">진행률</p>
                  <p className="mt-1 text-2xl font-bold">{Math.round(completionRate)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Assigned Quizzes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>할당된 퀴즈</CardTitle>
              <CardDescription>나에게 할당된 온보딩 퀴즈 목록</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedQuizzes.map((quiz, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        quiz.status === "completed"
                          ? "bg-success/10"
                          : quiz.status === "in-progress"
                          ? "bg-warning/10"
                          : "bg-muted"
                      }`}
                    >
                      {quiz.status === "completed" ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : quiz.status === "in-progress" ? (
                        <Clock className="h-6 w-6 text-warning" />
                      ) : (
                        <ClipboardList className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{quiz.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{quiz.category}</span>
                        <span>•</span>
                        <span>{quiz.questions}문항</span>
                        {quiz.status === "completed" && (
                          <>
                            <span>•</span>
                            <span className="text-success font-medium">
                              {quiz.score}점
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    {quiz.status === "completed" ? (
                      <Badge variant="secondary">완료</Badge>
                    ) : (
                      <Button size="sm" className="gap-2">
                        <Play className="h-4 w-4" />
                        {quiz.status === "in-progress" ? "이어하기" : "시작하기"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievements & Next Steps */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>다음 추천 학습</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed border-primary/50 p-4 text-center">
                  <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <h3 className="mb-1 font-semibold">복지 제도 안내</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    회사의 복지 제도를 알아보세요
                  </p>
                  <Button className="w-full">
                    시작하기
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>획득한 배지</CardTitle>
                <CardDescription>학습 성취도</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 text-center transition-all ${
                        achievement.earned
                          ? "border-primary bg-primary/5"
                          : "border-dashed opacity-50"
                      }`}
                    >
                      <div className="mb-1 text-3xl">{achievement.icon}</div>
                      <p className="text-xs font-medium">{achievement.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
