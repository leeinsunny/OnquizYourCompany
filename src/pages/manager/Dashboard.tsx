import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { TrendingUp, Users, ClipboardCheck, Award, AlertTriangle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EmployeeLayout from "@/components/employee/EmployeeLayout";

interface TeamMember {
  id: string;
  name: string;
  completion: number;
  latestQuiz: string;
  latestScore: number | null;
  status: 'completed' | 'in_progress' | 'delayed' | 'not_started';
}

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isManager, loading: roleLoading, isAdmin } = useUserRole();
  const [stats, setStats] = useState({
    teamCompletion: 0,
    avgScore: 0,
    activeMembers: 0,
    weeklyCompleted: 0
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [todos, setTodos] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate("/login");
      } else if (!isManager && !isAdmin) {
        navigate("/employee/dashboard");
      } else {
        fetchDashboardData();
      }
    }
  }, [user, isManager, isAdmin, authLoading, roleLoading, navigate]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch manager's profile and department
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, department_id')
        .eq('id', user.id)
        .single();

      if (!profile?.department_id) return;

      // Fetch team members in the same department
      const { data: members } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('department_id', profile.department_id)
        .neq('id', user.id);

      // Calculate stats for each team member
      const membersData = await Promise.all(
        (members || []).map(async (member) => {
          const { data: assignments } = await supabase
            .from('quiz_assignments')
            .select('quiz_id')
            .eq('user_id', member.id);

          const totalAssignments = assignments?.length || 0;

          const { data: attempts } = await supabase
            .from('quiz_attempts')
            .select(`
              quiz_id,
              status,
              score,
              percentage,
              quizzes!inner(title)
            `)
            .eq('user_id', member.id)
            .order('completed_at', { ascending: false });

          const completedCount = attempts?.filter(a => a.status === 'completed').length || 0;
          const completion = totalAssignments > 0 
            ? Math.round((completedCount / totalAssignments) * 100) 
            : 0;

          const latestAttempt = attempts?.[0];
          const latestQuiz = latestAttempt?.quizzes?.title || '퀴즈 없음';
          const latestScore = latestAttempt?.score || null;

          let status: TeamMember['status'] = 'not_started';
          if (completion >= 90) status = 'completed';
          else if (completion >= 50) status = 'in_progress';
          else if (completion > 0 && completion < 50) status = 'delayed';

          return {
            id: member.id,
            name: member.name,
            completion,
            latestQuiz,
            latestScore,
            status
          };
        })
      );

      setTeamMembers(membersData);

      // Calculate team stats
      const avgCompletion = membersData.length > 0
        ? Math.round(membersData.reduce((sum, m) => sum + m.completion, 0) / membersData.length)
        : 0;

      const completedAttempts = membersData.flatMap(m => 
        m.latestScore !== null ? [m.latestScore] : []
      );
      const avgScore = completedAttempts.length > 0
        ? Math.round(completedAttempts.reduce((a, b) => a + b, 0) / completedAttempts.length)
        : 0;

      const activeCount = membersData.filter(m => m.status !== 'not_started').length;

      // Get weekly completed count (simplified)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weeklyCount } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .in('user_id', members?.map(m => m.id) || [])
        .eq('status', 'completed')
        .gte('completed_at', weekAgo.toISOString());

      setStats({
        teamCompletion: avgCompletion,
        avgScore,
        activeMembers: activeCount,
        weeklyCompleted: weeklyCount || 0
      });

      // Generate insights
      const newInsights: string[] = [];
      if (avgScore < 70) {
        newInsights.push("팀 평균 점수가 낮습니다. 추가 학습 지원이 필요할 수 있습니다.");
      }
      const delayedMembers = membersData.filter(m => m.status === 'delayed');
      if (delayedMembers.length > 0) {
        newInsights.push(`${delayedMembers.length}명의 팀원이 온보딩 진행이 지연되고 있습니다.`);
      }
      if (newInsights.length === 0) {
        newInsights.push("팀의 온보딩 진행이 순조롭게 이루어지고 있습니다.");
      }
      setInsights(newInsights);

      // Generate to-dos
      const newTodos: string[] = [];
      if (delayedMembers.length > 0) {
        newTodos.push(`${delayedMembers[0].name}님 온보딩 진행 확인 필요`);
      }
      const notStartedMembers = membersData.filter(m => m.status === 'not_started');
      if (notStartedMembers.length > 0) {
        newTodos.push(`신규 팀원 ${notStartedMembers.length}명 환영 메시지 보내기`);
      }
      if (weeklyCount && weeklyCount > 0) {
        newTodos.push(`이번 주 완료된 퀴즈 ${weeklyCount}개 검토하기`);
      }
      if (newTodos.length === 0) {
        newTodos.push("현재 확인할 항목이 없습니다.");
      }
      setTodos(newTodos);

    } catch (error) {
      console.error('Error fetching manager dashboard data:', error);
    }
  };

  const statCards = [
    { 
      title: "팀 완료율", 
      value: `${stats.teamCompletion}%`, 
      icon: TrendingUp, 
      color: "text-blue-600" 
    },
    { 
      title: "평균 퀴즈 점수", 
      value: `${stats.avgScore}점`, 
      icon: Award, 
      color: "text-green-600" 
    },
    { 
      title: "진행 중인 팀원", 
      value: `${stats.activeMembers}명`, 
      icon: Users, 
      color: "text-purple-600" 
    },
    { 
      title: "이번 주 완료", 
      value: `${stats.weeklyCompleted}개 퀴즈`, 
      icon: ClipboardCheck, 
      color: "text-orange-600" 
    }
  ];

  const getStatusBadge = (status: TeamMember['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">거의 완료</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">진행 중</Badge>;
      case 'delayed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">지연</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100">시작 전</Badge>;
    }
  };

  return (
    <EmployeeLayout>
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-3xl font-bold">{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Members Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>우리 팀 온보딩 현황</CardTitle>
            <CardDescription>팀원들의 학습 진행 상태를 확인하고 관리하세요</CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">팀원 정보가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">{member.name}</p>
                        {getStatusBadge(member.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>완료율: {member.completion}%</p>
                        <p>최근 퀴즈: {member.latestQuiz}</p>
                        {member.latestScore !== null && (
                          <p>점수: {member.latestScore}점</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      상세 보기
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>팀 학습 인사이트</CardTitle>
              <CardDescription>개선이 필요한 영역</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* To-dos */}
          <Card>
            <CardHeader>
              <CardTitle>오늘 확인할 항목</CardTitle>
              <CardDescription>팀장 할 일</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {todos.map((todo, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-primary flex-shrink-0" />
                  <p>{todo}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default ManagerDashboard;
