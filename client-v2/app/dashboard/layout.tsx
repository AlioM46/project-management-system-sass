import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import WorkspaceProvider from "@/feature/workspace/components/WorkspaceProvider";
import React from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <WorkspaceProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-white dark:bg-[#050505]">
        {/* Sidebar */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 w-full md:pl-64 transition-all duration-300">
          <DashboardNavbar />

          <main className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-transparent">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
};

export default DashboardLayout;
