import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, CheckCircle, Lock, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import EmployeeLayout from "@/components/employee/EmployeeLayout";

interface Quiz {
  id: string;
  title: string;
  description: string;
  categories: { name: string };
  quiz_questions: { count: number }[];
  isAssigned: boolean;
  attempt?: {
    status: string;
    percentage: number;
    completed_at: string;
  };
}

const EmployeeQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Fetch all quizzes
      const { data: allQuizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`
          *,
          categories (name),
          quiz_questions (id)
        `)
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      if (quizzesError) throw quizzesError;

      // Fetch assignments
      const { data: assignments } = await supabase
        .from('quiz_assignments')
        .select('quiz_id')
        .eq('user_id', user.id);

      const assignedIds = new Set(assignments?.map(a => a.quiz_id) || []);

      // Fetch attempts
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('quiz_id, status, percentage, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      // Combine data
      const quizzesWithStatus = allQuizzes?.map(quiz => {
        const attempt = attempts?.find(a => a.quiz_id === quiz.id);
        return {
          ...quiz,
          quiz_questions: [{ count: quiz.quiz_questions?.length || 0 }],
          isAssigned: assignedIds.has(quiz.id),
          attempt: attempt ? {
            status: attempt.status,
            percentage: attempt.percentage || 0,
            completed_at: attempt.completed_at
          } : undefined
        };
      }) || [];

      setQuizzes(quizzesWithStatus);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignedQuizzes = quizzes.filter(q => q.isAssigned);
  const completedQuizzes = quizzes.filter(q => q.attempt);
  const incompleteAssignedQuizzes = assignedQuizzes.filter(q => !q.attempt);

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">퀴즈</h1>
          <p className="text-muted-foreground mt-1">
            온보딩 퀴즈를 풀고 회사에 대한 이해도를 높이세요
          </p>
        </div>

        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assigned">
              할당된 퀴즈 ({assignedQuizzes.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              전체 퀴즈 ({quizzes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">로딩 중...</p>
                </CardContent>
              </Card>
            ) : assignedQuizzes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    할당된 퀴즈가 없습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {incompleteAssignedQuizzes.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3">완료되지 않은 퀴즈</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {incompleteAssignedQuizzes.map((quiz) => (
                        <Card key={quiz.id} className="border-primary/50">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-base">{quiz.title}</CardTitle>
                                <CardDescription>
                                  {quiz.categories?.name}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary">미완료</Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ClipboardList className="h-4 w-4" />
                              <span>{quiz.quiz_questions[0]?.count || 0}문제</span>
                            </div>
                            <Link to={`/employee/quiz/${quiz.id}`}>
                              <Button className="w-full gap-2">
                                <Play className="h-4 w-4" />
                                퀴즈 시작하기
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {completedQuizzes.filter(q => q.isAssigned).length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-3">완료한 퀴즈</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {completedQuizzes.filter(q => q.isAssigned).map((quiz) => (
                        <Card key={quiz.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-base">{quiz.title}</CardTitle>
                                <CardDescription>
                                  {quiz.categories?.name}
                                </CardDescription>
                              </div>
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                완료
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">점수</span>
                              <span className="font-semibold text-lg">
                                {quiz.attempt?.percentage || 0}점
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              완료일: {new Date(quiz.attempt?.completed_at || '').toLocaleDateString('ko-KR')}
                            </div>
                            <Link to={`/employee/quiz/${quiz.id}`}>
                              <Button variant="outline" className="w-full">
                                다시 풀기
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">로딩 중...</p>
                </CardContent>
              </Card>
            ) : quizzes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    생성된 퀴즈가 없습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{quiz.title}</CardTitle>
                          <CardDescription>
                            {quiz.categories?.name}
                          </CardDescription>
                        </div>
                        {quiz.attempt ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {quiz.attempt.percentage}점
                          </Badge>
                        ) : (
                          <Badge variant="outline">미완료</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ClipboardList className="h-4 w-4" />
                        <span>{quiz.quiz_questions[0]?.count || 0}문제</span>
                      </div>
                      <Link to={`/employee/quiz/${quiz.id}`}>
                        <Button 
                          className="w-full gap-2"
                          variant={quiz.attempt ? "outline" : "default"}
                        >
                          {quiz.attempt ? (
                            <>다시 풀기</>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              시작하기
                            </>
                          )}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeQuizzes;
