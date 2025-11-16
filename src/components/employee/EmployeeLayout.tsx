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
        {/* Provider wraps the layout to enable collapsing sidebar */}
        {/* We inline import to avoid circular deps */}
        {/* eslint-disable-next-line @typescript-eslint/no-var-requires */}
        <SidebarProvider open={open} onOpenChange={setOpen}>
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
