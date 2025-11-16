import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import AdminLayout from "@/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Users, FileText, ClipboardList, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading, isManager } = useUserRole();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalQuizzes: 0,
    totalEmployees: 0,
    averageCompletion: 0
  });
  const [teamProgress, setTeamProgress] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isAdmin && !isManager) {
        navigate("/employee/dashboard");
      } else {
        fetchDashboardData();
      }
    }
  }, [user, isAdmin, isManager, authLoading, roleLoading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { count: docCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('status', 'approved');

      const { count: quizCount } = await supabase
        .from('quizzes')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      const { count: empCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      const { data: departments } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', profile.company_id);

      const deptProgress = await Promise.all(
        (departments || []).map(async (dept) => {
          const { count: deptMembers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', dept.id);

          const { data: assignments } = await supabase
            .from('quiz_assignments')
            .select(`
              quiz_id,
              user_id,
              profiles!inner(department_id)
            `)
            .eq('profiles.department_id', dept.id);

          const completedCount = await Promise.all(
            (assignments || []).map(async (a) => {
              const { data: attempts } = await supabase
                .from('quiz_attempts')
                .select('status')
                .eq('quiz_id', a.quiz_id)
                .eq('user_id', a.user_id)
                .eq('status', 'completed');
              return attempts?.length || 0;
            })
          );

          const totalAssignments = assignments?.length || 1;
          const completed = completedCount.reduce((a, b) => a + b, 0);
          const progress = Math.round((completed / totalAssignments) * 100);

          return {
            team: dept.name,
            progress: isNaN(progress) ? 0 : progress,
            members: deptMembers || 0
          };
        })
      );

      const avgCompletion = deptProgress.length > 0
        ? Math.round(deptProgress.reduce((sum, d) => sum + d.progress, 0) / deptProgress.length)
        : 0;

      const { data: recentAttempts } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          score,
          completed_at,
          user_id,
          profiles!inner(name, department_id),
          quizzes!inner(title)
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);

      setStats({
        totalDocuments: docCount || 0,
        totalQuizzes: quizCount || 0,
        totalEmployees: empCount || 0,
        averageCompletion: avgCompletion
      });

      setTeamProgress(deptProgress);
      setRecentActivities(recentAttempts || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const kpiCards = [
    { 
      title: "전체 온보딩 자료", 
      value: `${stats.totalDocuments}개`, 
      subtitle: "등록됨", 
      icon: FileText, 
      color: "text-blue-600" 
    },
    { 
      title: "전체 퀴즈", 
      value: `${stats.totalQuizzes}개`, 
      subtitle: "활성화", 
      icon: ClipboardList, 
      color: "text-green-600" 
    },
    { 
      title: "전체 신입사원", 
      value: `${stats.totalEmployees}명`, 
      subtitle: "온보딩 중", 
      icon: Users, 
      color: "text-purple-600" 
    },
    { 
      title: "평균 완료율", 
      value: `${stats.averageCompletion}%`, 
      subtitle: "회사 전체", 
      icon: TrendingUp, 
      color: "text-orange-600" 
    }
  ];

  const pendingActions = [
    { 
      title: "신규 관리자 2명 승인 대기 중", 
      icon: AlertCircle 
    },
    { 
      title: "3개 온보딩 자료가 6개월 이상 업데이트되지 않았습니다", 
      icon: Clock 
    },
    { 
      title: "이번 주 완료된 퀴즈 검토 필요", 
      icon: ClipboardList 
    }
  ];

  return (
    <AdminLayout>
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <Card key={index} className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>부서별 온보딩 진행률</CardTitle>
            <CardDescription>각 부서의 온보딩 완료 상태를 확인하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">부서 정보가 없습니다</p>
            ) : (
              teamProgress.map((team, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{team.team}</span>
                    <span className="text-muted-foreground">
                      {team.progress}% ({team.members}명 진행 중)
                    </span>
                  </div>
                  <Progress value={team.progress} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>확인이 필요한 항목</CardTitle>
              <CardDescription>관리 알림</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingActions.map((action, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <action.icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm">{action.title}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>최근 온보딩 활동</CardTitle>
              <CardDescription>최근 완료 기록</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">활동 기록이 없습니다</p>
              ) : (
                recentActivities.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="text-sm space-y-1">
                    <p className="font-medium">
                      {activity.profiles?.name}님이 '{activity.quizzes?.title}' 완료
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {activity.score !== null ? `${activity.score}점` : '점수 기록 없음'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
