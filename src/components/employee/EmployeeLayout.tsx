import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import EmployeeSidebar from "@/components/employee/EmployeeSidebar";

interface EmployeeLayoutProps {
  children: ReactNode;
}

const EmployeeLayout = ({ children }: EmployeeLayoutProps) => {

  return (
    <div className="min-h-screen bg-background">

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
