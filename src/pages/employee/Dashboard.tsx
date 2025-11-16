import { useEffect, useState } from "react";
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
  LogOut,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface QuizAssignment {
  id: string;
  quiz_id: string;
  due_date: string | null;
  quiz: {
    id: string;
    title: string;
    category: {
      name: string;
    };
  };
  attempts: Array<{
    id: string;
    status: string;
    score: number | null;
    percentage: number | null;
    time_spent: number | null;
  }>;
  questions_count: number;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    completedQuizzes: 0,
    averageScore: 0,
    totalCategories: 0,
    completedCategories: 0
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      setProfile(profileData);

      // Fetch quiz assignments with related data
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('quiz_assignments')
        .select(`
          id,
          quiz_id,
          due_date,
          quiz:quizzes!inner (
            id,
            title,
            category:categories (
              name
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Fetch attempts for each quiz
      const enrichedAssignments = await Promise.all(
        (assignmentsData || []).map(async (assignment: any) => {
          // Count questions for this quiz
          const { count: questionsCount } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', assignment.quiz_id);

          // Get latest attempt
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('quiz_id', assignment.quiz_id)
            .eq('user_id', user!.id)
            .order('started_at', { ascending: false });

          return {
            ...assignment,
            attempts: attempts || [],
            questions_count: questionsCount || 0
          };
        })
      );

      setAssignments(enrichedAssignments);

      // Calculate statistics
      const completedAttempts = enrichedAssignments.filter(
        a => a.attempts.length > 0 && a.attempts[0].status === 'completed'
      );

      const totalScore = completedAttempts.reduce(
        (sum, a) => sum + (a.attempts[0].percentage || 0),
        0
      );

      const uniqueCategories = new Set(
        enrichedAssignments.map(a => a.quiz.category?.name).filter(Boolean)
      );

      const completedCategories = new Set(
        completedAttempts.map(a => a.quiz.category?.name).filter(Boolean)
      );

      setStats({
        totalQuizzes: enrichedAssignments.length,
        completedQuizzes: completedAttempts.length,
        averageScore: completedAttempts.length > 0 
          ? Math.round(totalScore / completedAttempts.length) 
          : 0,
        totalCategories: uniqueCategories.size,
        completedCategories: completedCategories.size
      });

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "오류",
        description: "대시보드 데이터를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast({
        title: "오류",
        description: "로그아웃에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleStartQuiz = (assignment: QuizAssignment) => {
    const latestAttempt = assignment.attempts[0];
    
    if (latestAttempt?.status === 'in_progress') {
      // Continue existing attempt
      navigate(`/employee/quiz/${assignment.quiz_id}?attempt=${latestAttempt.id}`);
    } else {
      // Start new attempt
      navigate(`/employee/quiz/${assignment.quiz_id}`);
    }
  };

  const getQuizStatus = (assignment: QuizAssignment) => {
    if (assignment.attempts.length === 0) {
      return { status: 'not-started', label: '시작하기' };
    }
    
    const latestAttempt = assignment.attempts[0];
    if (latestAttempt.status === 'completed') {
      return { status: 'completed', label: '완료', score: latestAttempt.percentage };
    }
    
    return { status: 'in-progress', label: '이어하기' };
  };

  // Calculate achievements
  const hasCompletedFirstQuiz = stats.completedQuizzes >= 1;
  const hasCompletedAll = stats.completedQuizzes === stats.totalQuizzes && stats.totalQuizzes > 0;
  const hasPerfectScore = assignments.some(
    a => a.attempts[0]?.percentage === 100
  );
  
  // Check for 3-day streak (simplified - checking if there are attempts on 3 different days)
  const attemptDates = assignments
    .flatMap(a => a.attempts)
    .map(attempt => new Date(attempt.id).toDateString());
  const uniqueDates = new Set(attemptDates);
  const has3DayStreak = uniqueDates.size >= 3;

  const achievements = [
    { name: "첫 퀴즈 완료", icon: "🎯", earned: hasCompletedFirstQuiz },
    { name: "연속 3일 학습", icon: "🔥", earned: has3DayStreak },
    { name: "만점 달성", icon: "⭐", earned: hasPerfectScore },
    { name: "전체 완료", icon: "🏆", earned: hasCompletedAll }
  ];

  // Find next recommended quiz
  const nextQuiz = assignments.find(a => {
    const status = getQuizStatus(a);
    return status.status !== 'completed';
  });

  const completionRate = stats.totalQuizzes > 0 
    ? (stats.completedQuizzes / stats.totalQuizzes) * 100 
    : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <Button variant="ghost" onClick={() => navigate('/employee/dashboard')}>홈</Button>
            <Button variant="ghost" onClick={() => navigate('/employee/materials')}>온보딩 자료</Button>
            <Button variant="ghost" onClick={() => navigate('/employee/quizzes')}>퀴즈</Button>
            <Button variant="ghost" onClick={() => navigate('/employee/profile')}>내 프로필</Button>
          </nav>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8 rounded-lg bg-gradient-hero p-8 text-white">
          <h1 className="mb-2 text-3xl font-bold">
            환영합니다, {profile?.name || '사용자'}님! 👋
          </h1>
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
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>할당된 퀴즈가 없습니다.</p>
                </div>
              ) : (
                assignments.map((assignment) => {
                  const quizStatus = getQuizStatus(assignment);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                            quizStatus.status === "completed"
                              ? "bg-success/10"
                              : quizStatus.status === "in-progress"
                              ? "bg-warning/10"
                              : "bg-muted"
                          }`}
                        >
                          {quizStatus.status === "completed" ? (
                            <CheckCircle2 className="h-6 w-6 text-success" />
                          ) : quizStatus.status === "in-progress" ? (
                            <Clock className="h-6 w-6 text-warning" />
                          ) : (
                            <ClipboardList className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{assignment.quiz.title}</h3>
                          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{assignment.quiz.category?.name || '미분류'}</span>
                            <span>•</span>
                            <span>{assignment.questions_count}문항</span>
                            {quizStatus.status === "completed" && quizStatus.score !== undefined && (
                              <>
                                <span>•</span>
                                <span className="text-success font-medium">
                                  {Math.round(quizStatus.score)}점
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        {quizStatus.status === "completed" ? (
                          <Badge variant="secondary">완료</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleStartQuiz(assignment)}
                          >
                            <Play className="h-4 w-4" />
                            {quizStatus.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Achievements & Next Steps */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>다음 추천 학습</CardTitle>
              </CardHeader>
              <CardContent>
                {nextQuiz ? (
                  <div className="rounded-lg border-2 border-dashed border-primary/50 p-4 text-center">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-primary" />
                    <h3 className="mb-1 font-semibold">{nextQuiz.quiz.title}</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {nextQuiz.quiz.category?.name || '미분류'} • {nextQuiz.questions_count}문항
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => handleStartQuiz(nextQuiz)}
                    >
                      {getQuizStatus(nextQuiz).label}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-10 w-10 mx-auto mb-3 text-success" />
                    <p className="font-semibold text-foreground">모든 퀴즈 완료!</p>
                    <p className="text-sm mt-1">훌륭합니다! 🎉</p>
                  </div>
                )}
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
