import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EmployeeLayoutProps {
  children: ReactNode;
}

const EmployeeLayout = ({ children }: EmployeeLayoutProps) => {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("로그아웃되었습니다");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/employee/dashboard" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-hero" />
              <span className="text-xl font-bold">OnQuiz</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Layout */}
      <div className="flex">
        {/* Provider wraps the layout to enable collapsing sidebar */}
        {/* We inline import to avoid circular deps */}
        {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
        <SidebarProvider>
          <div className="w-full flex">
            <EmployeeSidebar />
            <main className="flex-1">
              <div className="border-b bg-background">
                <div className="container py-2">
                  <SidebarTrigger />
                </div>
              </div>
              <div className="container py-6">{children}</div>
            </main>
          </div>
        </SidebarProvider>
      </div>
    </div>
  );
};

export default EmployeeLayout;
