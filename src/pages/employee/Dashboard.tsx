import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import EmployeeLayout from "@/components/employee/EmployeeLayout";

interface QuizItem {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
  estimatedTime: string;
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [nextQuiz, setNextQuiz] = useState<QuizItem | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [recentCompleted, setRecentCompleted] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: assignments } = await supabase
        .from('quiz_assignments')
        .select(`
          quiz_id,
          quiz:quizzes!inner(id, title)
        `)
        .eq('user_id', user!.id);

      const enrichedQuizzes = await Promise.all(
        (assignments || []).map(async (assignment: any) => {
          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select('status, score, percentage')
            .eq('quiz_id', assignment.quiz_id)
            .eq('user_id', user!.id)
            .order('started_at', { ascending: false });

          const latestAttempt = attempts?.[0];
          let status: QuizItem['status'] = 'not_started';
          if (latestAttempt) {
            status = latestAttempt.status === 'completed' ? 'completed' : 'in_progress';
          }

          const { count } = await supabase
            .from('quiz_questions')
            .select('*', { count: 'exact', head: true })
            .eq('quiz_id', assignment.quiz_id);

          const estimatedTime = `${Math.max(10, (count || 0) * 2)}분`;

          return {
            id: assignment.quiz_id,
            title: assignment.quiz.title,
            status,
            score: latestAttempt?.score || null,
            estimatedTime
          };
        })
      );

      setQuizzes(enrichedQuizzes);

      const completedCount = enrichedQuizzes.filter(q => q.status === 'completed').length;
      const totalCount = enrichedQuizzes.length || 1;
      const progress = Math.round((completedCount / totalCount) * 100);
      setOverallProgress(progress);

      const notStarted = enrichedQuizzes.find(q => q.status === 'not_started');
      const inProgress = enrichedQuizzes.find(q => q.status === 'in_progress');
      setNextQuiz(inProgress || notStarted || null);

      const completed = enrichedQuizzes.filter(q => q.status === 'completed').slice(0, 3);
      setRecentCompleted(completed);

      if (completedCount > 0) {
        const avgScore = completed.reduce((sum, q) => sum + (q.score || 0), 0) / completedCount;
        if (avgScore < 75) {
          setFeedback("복습을 권장합니다. 어려운 부분은 팀장님께 문의해 보세요.");
        } else if (avgScore >= 90) {
          setFeedback("훌륭합니다! 계속해서 좋은 성과를 유지하고 있습니다.");
        } else {
          setFeedback("잘하고 있습니다! 조금만 더 노력하면 더 좋은 결과를 얻을 수 있어요.");
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "오류",
        description: "데이터를 불러오는 중 문제가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quizId: string) => {
    navigate(`/employee/quiz-take/${quizId}`);
  };

  const getStatusIcon = (status: QuizItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: QuizItem['status']) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'in_progress':
        return '진행 중';
      default:
        return '시작 전';
    }
  };

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>내 온보딩 진행률</CardTitle>
              <CardDescription>
                전체 {quizzes.length}개 중 {quizzes.filter(q => q.status === 'completed').length}개 완료
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - overallProgress / 100)}`}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{overallProgress}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    {overallProgress >= 70 
                      ? "거의 다 왔습니다! 마지막까지 화이팅!" 
                      : "차근차근 진행해 나가고 있습니다."}
                  </p>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {nextQuiz && (
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle>지금 해야 할 일</CardTitle>
                <CardDescription>다음 단계</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{nextQuiz.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      예상 소요 시간: {nextQuiz.estimatedTime}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleStartQuiz(nextQuiz.id)}
                    size="lg"
                    className="w-full"
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    {nextQuiz.status === 'in_progress' ? '계속하기' : '지금 시작하기'}
                  </Button>
                  {nextQuiz.status === 'in_progress' && (
                    <p className="text-xs text-center text-muted-foreground">
                      진행 중인 퀴즈가 있습니다
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>내 학습 목록</CardTitle>
              <CardDescription>할당된 퀴즈</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">할당된 퀴즈가 없습니다</p>
              ) : (
                quizzes.map((quiz) => (
                  <div 
                    key={quiz.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                    onClick={() => quiz.status !== 'completed' && handleStartQuiz(quiz.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(quiz.status)}
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {getStatusText(quiz.status)} 
                          {quiz.status !== 'completed' && ` • ${quiz.estimatedTime}`}
                          {quiz.status === 'completed' && quiz.score !== null && ` • ${quiz.score}점`}
                        </p>
                      </div>
                    </div>
                    {quiz.status !== 'completed' && (
                      <Button variant="ghost" size="sm">시작</Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>최근 학습 결과</CardTitle>
              <CardDescription>최근 완료한 퀴즈</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentCompleted.length === 0 ? (
                <p className="text-sm text-muted-foreground">완료한 퀴즈가 없습니다</p>
              ) : (
                recentCompleted.map((quiz) => (
                  <div key={quiz.id} className="space-y-1">
                    <p className="font-medium text-sm">{quiz.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={quiz.score >= 80 ? "default" : "secondary"}>
                        {quiz.score}점
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {quiz.score >= 90 ? "잘 이해하셨어요!" : quiz.score >= 70 ? "훌륭합니다" : "복습을 권장합니다"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {feedback && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  학습 가이드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{feedback}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  궁금한 점이 있으면 팀장님께 문의해 주세요.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;
