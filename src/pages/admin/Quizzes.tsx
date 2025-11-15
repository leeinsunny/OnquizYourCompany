import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Users, Plus, BarChart3, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { QuizDetailDialog } from "@/components/admin/QuizDetailDialog";

const AdminQuizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailQuizId, setDetailQuizId] = useState<string>("");
  const [detailQuizTitle, setDetailQuizTitle] = useState<string>("");

  useEffect(() => {
    fetchQuizzes();
    fetchUsers();
  }, []);

  const fetchQuizzes = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    if (!profile) return;

    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        categories(name),
        quiz_questions(count)
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQuizzes(data);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id)
      .single();

    if (!profile) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, department_id')
      .eq('company_id', profile.company_id);

    if (data) {
      setUsers(data);
    }
  };

  const handleAssignQuiz = async () => {
    if (!selectedQuiz || selectedUsers.length === 0) {
      toast.error("퀴즈와 사용자를 선택해주세요");
      return;
    }

    const assignments = selectedUsers.map(userId => ({
      quiz_id: selectedQuiz.id,
      user_id: userId,
      assigned_by: user?.id
    }));

    const { error } = await supabase
      .from('quiz_assignments')
      .upsert(assignments, { onConflict: 'quiz_id,user_id' });

    if (error) {
      toast.error("할당 중 오류가 발생했습니다");
    } else {
      toast.success(`${selectedUsers.length}명에게 퀴즈가 할당되었습니다`);
      setAssignDialogOpen(false);
      setSelectedUsers([]);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleViewQuiz = (quiz: any) => {
    setDetailQuizId(quiz.id);
    setDetailQuizTitle(quiz.title);
    setDetailDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">퀴즈 관리</h2>
          <p className="text-muted-foreground">퀴즈를 관리하고 사원에게 할당하세요</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체 퀴즈</p>
                <p className="text-3xl font-bold">{quizzes.length}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">활성 퀴즈</p>
                <p className="text-3xl font-bold">
                  {quizzes.filter((q: any) => q.is_active).length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">사용자</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>퀴즈 목록</CardTitle>
          <CardDescription>모든 카테고리의 퀴즈를 확인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">로딩 중...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">퀴즈가 없습니다</p>
              <p className="text-sm text-muted-foreground">먼저 온보딩 자료를 업로드하세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz: any) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{quiz.title}</h3>
                      {quiz.is_active ? (
                        <Badge variant="default">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{quiz.categories?.name}</span>
                      <span>•</span>
                      <span>{quiz.quiz_questions?.[0]?.count || 0}문항</span>
                      <span>•</span>
                      <span>합격 점수: {quiz.pass_score}점</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => handleViewQuiz(quiz)}
                    >
                      <Eye className="h-4 w-4" />
                      상세 보기
                    </Button>
                    <Dialog open={assignDialogOpen && selectedQuiz?.id === quiz.id} onOpenChange={(open) => {
                      setAssignDialogOpen(open);
                      if (open) setSelectedQuiz(quiz);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Users className="h-4 w-4" />
                          퀴즈 할당
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>퀴즈 할당</DialogTitle>
                          <DialogDescription>
                            이 퀴즈를 풀 사원을 선택하세요
                          </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[400px] overflow-y-auto space-y-2">
                          {users.map((u: any) => (
                            <div key={u.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded">
                              <Checkbox
                                checked={selectedUsers.includes(u.id)}
                                onCheckedChange={() => toggleUserSelection(u.id)}
                              />
                              <div className="flex-1">
                                <p className="font-medium">{u.name}</p>
                                <p className="text-sm text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            취소
                          </Button>
                          <Button onClick={handleAssignQuiz}>
                            {selectedUsers.length}명에게 할당
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QuizDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        quizId={detailQuizId}
        quizTitle={detailQuizTitle}
      />
      </div>
    </AdminLayout>
  );
};

export default AdminQuizzes;
