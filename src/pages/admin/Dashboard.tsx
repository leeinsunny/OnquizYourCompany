import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  Bell,
  Settings,
  Upload,
  BarChart3,
  LogOut,
  Menu
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "총 온보딩 자료",
      value: "24",
      change: "+3 이번 주",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "총 퀴즈 문항",
      value: "156",
      change: "+12 신규",
      icon: ClipboardList,
      color: "text-green-600"
    },
    {
      title: "신입사원",
      value: "18",
      change: "5명 진행 중",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "평균 완료율",
      value: "78%",
      change: "+5% 상승",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  const teamProgress = [
    { team: "개발팀", progress: 85, members: 5, color: "bg-blue-500" },
    { team: "마케팅팀", progress: 72, members: 4, color: "bg-green-500" },
    { team: "디자인팀", progress: 90, members: 3, color: "bg-purple-500" },
    { team: "영업팀", progress: 65, members: 6, color: "bg-orange-500" }
  ];

  const recentActivities = [
    {
      user: "김지원 (마케팅팀)",
      action: "회사 시설 정보 퀴즈를 85점으로 완료",
      time: "2시간 전"
    },
    {
      user: "이민수 (개발팀)",
      action: "보안 규정 퀴즈를 완료하고 만점 획득",
      time: "4시간 전"
    },
    {
      user: "박서연 (디자인팀)",
      action: "복지 제도 퀴즈 시작",
      time: "5시간 전"
    }
  ];

  const pendingActions = [
    { title: "신규 가입 승인 대기", count: 3, type: "warning" },
    { title: "리더가 작성한 퀴즈 검토 필요", count: 2, type: "info" },
    { title: "최근 퀴즈 결과 확인", count: 5, type: "success" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="h-8 w-8 rounded-lg bg-gradient-hero" />
          <span className="text-lg font-bold">OnQuiz</span>
        </div>
        <nav className="space-y-1 p-4">
          <Button variant="secondary" className="w-full justify-start gap-2">
            <BarChart3 className="h-4 w-4" />
            대시보드
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Upload className="h-4 w-4" />
            자료 업로드
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <ClipboardList className="h-4 w-4" />
            퀴즈 관리
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Users className="h-4 w-4" />
            사용자 관리
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            설정
          </Button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">관리자 대시보드</h1>
              <p className="text-sm text-muted-foreground">전체 온보딩 현황을 확인하세요</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Stats Grid */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Team Progress */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>팀별 진행률</CardTitle>
                <CardDescription>각 팀의 온보딩 완료 현황</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamProgress.map((team, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{team.team}</span>
                      <span className="text-muted-foreground">
                        {team.progress}% ({team.members}명)
                      </span>
                    </div>
                    <Progress value={team.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle>할 일</CardTitle>
                <CardDescription>확인이 필요한 항목</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{action.title}</p>
                    </div>
                    <Badge
                      variant={
                        action.type === "warning"
                          ? "destructive"
                          : action.type === "info"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {action.count}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>최근 활동</CardTitle>
              <CardDescription>신입사원들의 최근 학습 활동</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 last:pb-0 border-b last:border-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
