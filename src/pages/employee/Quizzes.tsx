import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList } from "lucide-react";
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
  const allQuizzes = quizzes;

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
            <TabsTrigger value="assigned">할당된 퀴즈 ({assignedQuizzes.length})</TabsTrigger>
            <TabsTrigger value="all">전체 퀴즈 ({allQuizzes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    로딩 중...
                  </div>
                ) : assignedQuizzes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>할당된 퀴즈가 없습니다.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3">제목</th>
                          <th className="text-left py-3">카테고리</th>
                          <th className="text-right py-3">문항</th>
                          <th className="text-right py-3">상태</th>
                          <th className="text-right py-3">액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedQuizzes.map((q) => (
                          <tr key={q.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 font-medium text-foreground">{q.title}</td>
                            <td className="py-3">{q.categories?.name || '-'}</td>
                            <td className="py-3 text-right">{q.quiz_questions?.[0]?.count ?? 0}</td>
                            <td className="py-3 text-right">
                              {q.attempt ? (
                                <Badge variant="default" className="text-xs">
                                  완료 ({q.attempt.percentage}%)
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  미완료
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <Link to={`/employee/quiz/${q.id}`}>
                                <Button size="sm" variant="secondary">
                                  {q.attempt ? '복습하기' : '시작하기'}
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    로딩 중...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left py-3">제목</th>
                          <th className="text-left py-3">카테고리</th>
                          <th className="text-right py-3">문항</th>
                          <th className="text-right py-3">할당됨</th>
                          <th className="text-right py-3">액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allQuizzes.map((q) => (
                          <tr key={q.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 font-medium text-foreground">{q.title}</td>
                            <td className="py-3">{q.categories?.name || '-'}</td>
                            <td className="py-3 text-right">{q.quiz_questions?.[0]?.count ?? 0}</td>
                            <td className="py-3 text-right">
                              {q.isAssigned ? (
                                <Badge variant="default" className="text-xs">예</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">아니오</Badge>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <Link to={`/employee/quiz/${q.id}`}>
                                <Button size="sm" variant="secondary">
                                  {q.attempt ? '복습하기' : '시작하기'}
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeQuizzes;
