import { Home, BookOpen, ClipboardList, User } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "홈", url: "/employee/dashboard", icon: Home },
  { title: "온보딩 자료", url: "/employee/materials", icon: BookOpen },
  { title: "퀴즈", url: "/employee/quizzes", icon: ClipboardList },
  { title: "내 프로필", url: "/employee/profile", icon: User },
];

export default function EmployeeSidebar() {
  const { state } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible className={state === "collapsed" ? "w-14" : "w-60"}>
      <SidebarContent>
        <SidebarGroup defaultOpen>
          <SidebarGroupLabel>내비게이션</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-muted/50">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
