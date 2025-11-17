import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";

interface EmployeeLayoutProps {
  children: ReactNode;
}

const EmployeeLayout = ({ children }: EmployeeLayoutProps) => {
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("employee-sidebar-open");
    return saved !== null ? saved === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("employee-sidebar-open", String(open));
  }, [open]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Layout */}
      <div className="flex">
        <SidebarProvider open={open} onOpenChange={setOpen}>
          <div className="w-full flex">
            <EmployeeSidebar />
            <main className="flex-1">
              <div className="border-b bg-background">
                <div className="container py-2 flex items-center gap-4">
                  <SidebarTrigger />
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex-shrink-0" />
                    <span className="text-lg font-bold">OnQuiz</span>
                  </div>
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
