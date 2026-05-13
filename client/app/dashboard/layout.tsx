import { WorkspaceProvider } from "@/features/workspaces/components/WorkspaceProvider";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <WorkspaceProvider>
            {/* 
               Once WorkspaceProvider finishes checking the context and loading,
               it renders the children here. 
               Later, we will add the Sidebar and Navbar around {children} 
            */}
            <div className="flex min-h-screen flex-col bg-background">
                {children}
            </div>
        </WorkspaceProvider>
    );
}
