import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  CalendarDays,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EmployeeLayout from "@/components/employee/EmployeeLayout";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import CalendarNotes from "@/components/employee/CalendarNotes";

interface QuizItem {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
  score: number | null;
  estimatedTime: string;
  dueDate: string | null;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user!.id)
      .maybeSingle();
    if (data) setProfileName(data.name);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: assignments } = await supabase
        .from("quiz_assignments")
        .select(`quiz_id, due_date, quiz:quizzes!inner(id, title)`)
        .eq("user_id", user!.id);

      const enrichedQuizzes = await Promise.all(
        (assignments || []).map(async (assignment: any) => {
          const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("status, score, percentage")
            .eq("quiz_id", assignment.quiz_id)
            .eq("user_id", user!.id)
            .order("started_at", { ascending: false });

          const latestAttempt = attempts?.[0];
          let status: QuizItem["status"] = "not_started";
          if (latestAttempt) {
            status = latestAttempt.status === "completed" ? "completed" : "in_progress";
          }

          const { count } = await supabase
            .from("quiz_questions")
            .select("*", { count: "exact", head: true })
            .eq("quiz_id", assignment.quiz_id);

          const estimatedTime = `${Math.max(10, (count || 0) * 2)}분`;

          return {
            id: assignment.quiz_id,
            title: assignment.quiz.title,
            status,
            score: latestAttempt?.score || null,
            estimatedTime,
            dueDate: assignment.due_date,
          };
        })
      );

      setQuizzes(enrichedQuizzes);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "오류",
        description: "데이터를 불러오는 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completedCount = quizzes.filter((q) => q.status === "completed").length;
  const totalCount = quizzes.length || 1;
  const overallProgress = Math.round((completedCount / totalCount) * 100);

  const quizzesForSelectedDate = useMemo(() => {
    if (!selectedDate) return quizzes;
    return quizzes.filter((q) => {
      if (!q.dueDate) return false;
      return isSameDay(new Date(q.dueDate), selectedDate);
    });
  }, [quizzes, selectedDate]);

  const dueDates = useMemo(() => {
    return quizzes
      .filter((q) => q.dueDate && q.status !== "completed")
      .map((q) => new Date(q.dueDate!));
  }, [quizzes]);

  const nextQuiz = useMemo(() => {
    const inProgress = quizzes.find((q) => q.status === "in_progress");
    const notStarted = quizzes.find((q) => q.status === "not_started");
    return inProgress || notStarted || null;
  }, [quizzes]);

  const handleStartQuiz = (quizId: string) => {
    navigate(`/employee/quiz/${quizId}`);
  };

  const getStatusBadge = (status: QuizItem["status"], score: number | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            완료 {score !== null && `• ${score}점`}
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-0">
            <PlayCircle className="h-3 w-3 mr-1" />
            진행 중
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="border-0">
            <Clock className="h-3 w-3 mr-1" />
            시작 전
          </Badge>
        );
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "좋은 아침이에요";
    if (hour < 18) return "좋은 오후예요";
    return "좋은 저녁이에요";
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted-foreground text-sm">대시보드 불러오는 중...</p>
          </div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Greeting + Progress Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {getGreeting()}, {profileName || "사원"}님 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              온보딩 진행률{" "}
              <span className="font-semibold text-foreground">{overallProgress}%</span> •{" "}
              {quizzes.length}개 중 {completedCount}개 완료
            </p>
          </div>
          {nextQuiz && (
            <Button
              onClick={() => handleStartQuiz(nextQuiz.id)}
              size="lg"
              className="gap-2 shadow-md"
            >
              <Sparkles className="h-4 w-4" />
              {nextQuiz.status === "in_progress" ? "이어서 학습하기" : "다음 학습 시작"}
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Quiz To-Do List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">
                      {selectedDate && quizzesForSelectedDate.length > 0
                        ? `${format(selectedDate, "M월 d일", { locale: ko })} 학습 목록`
                        : "전체 학습 목록"}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {quizzes.filter((q) => q.status !== "completed").length}개 남음
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(quizzesForSelectedDate.length > 0 ? quizzesForSelectedDate : quizzes).length ===
                0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">
                      {quizzesForSelectedDate.length === 0 && selectedDate
                        ? "이 날짜에 예정된 학습이 없습니다"
                        : "할당된 학습이 없습니다"}
                    </p>
                  </div>
                ) : (
                  (quizzesForSelectedDate.length > 0 ? quizzesForSelectedDate : quizzes).map(
                    (quiz) => (
                      <div
                        key={quiz.id}
                        className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/40 transition-all cursor-pointer"
                        onClick={() => quiz.status !== "completed" && handleStartQuiz(quiz.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                              quiz.status === "completed"
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : quiz.status === "in_progress"
                                ? "bg-sky-100 dark:bg-sky-900/30"
                                : "bg-muted"
                            }`}
                          >
                            {quiz.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : quiz.status === "in_progress" ? (
                              <PlayCircle className="h-4 w-4 text-sky-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`font-medium text-sm truncate ${
                                quiz.status === "completed" ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {quiz.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {getStatusBadge(quiz.status, quiz.score)}
                              <span className="text-xs text-muted-foreground">
                                {quiz.estimatedTime}
                              </span>
                              {quiz.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  • 마감 {format(new Date(quiz.dueDate), "M/d")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {quiz.status !== "completed" && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        )}
                      </div>
                    )
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Calendar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">학습 캘린더</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={ko}
                  className="pointer-events-auto"
                  modifiers={{
                    hasDue: dueDates,
                  }}
                  modifiersStyles={{
                    hasDue: {
                      fontWeight: "bold",
                      textDecoration: "underline",
                      textDecorationColor: "hsl(var(--primary))",
                      textUnderlineOffset: "4px",
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">{completedCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">완료</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">
                      {quizzes.filter((q) => q.status === "in_progress").length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">진행 중</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">
                      {quizzes.filter((q) => q.status === "not_started").length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">시작 전</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-accent-foreground">{overallProgress}%</p>
                    <p className="text-xs text-muted-foreground mt-1">진행률</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
