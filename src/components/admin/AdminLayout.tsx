import { ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  FileText,
  ClipboardList,
  Users,
  Settings,
  Bell,
  LogOut,
  ChevronRight
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSkeleton
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { role, isAdmin, isManager, loading: roleLoading } = useUserRole();
  const [jobTitle, setJobTitle] = useState<string>('');

  useEffect(() => {
    const fetchJobTitle = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('job_title')
        .eq('id', user.id)
        .single();
      if (data) setJobTitle(data.job_title || '');
    };
    fetchJobTitle();
  }, [user]);

  const navItems = [
    { 
      icon: BarChart3, 
      label: "대시보드", 
      path: "/admin/dashboard",
      roles: ['super_admin', 'admin', 'manager']
    },
    { 
      icon: FileText, 
      label: "온보딩 자료 관리", 
      path: "/admin/documents",
      roles: ['super_admin', 'admin', 'manager']
    },
    { 
      icon: ClipboardList, 
      label: "퀴즈 관리", 
      path: "/admin/quizzes",
      roles: ['super_admin', 'admin', 'manager']
    },
    { 
      icon: Users, 
      label: "사용자 관리", 
      path: "/admin/users",
      roles: ['super_admin', 'admin']
    },
    { 
      icon: Settings, 
      label: "설정", 
      path: "/admin/settings",
      roles: ['super_admin']
    }
  ];

  const visibleNavItems = navItems.filter(item => 
    item.roles.includes(role)
  );

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b">
            <div className="flex items-center gap-2 px-2 py-4">
              <span className="text-lg font-bold">OnQuiz</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>메뉴</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {roleLoading ? (
                    <SidebarMenuSkeleton />
                  ) : (
                    visibleNavItems.map((item) => (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          onClick={() => navigate(item.path)}
                          isActive={isActive(item.path)}
                          tooltip={item.label}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(user?.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium truncate max-w-[140px]">
                          {user?.email?.split('@')[0]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(role === 'super_admin' || role === 'admin') ? '회사 관리자' : jobTitle || '직원'}
                        </span>
                      </div>
                      <ChevronRight className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                      프로필 설정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">관리자 패널</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
