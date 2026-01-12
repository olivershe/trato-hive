"use client";

import { Sidebar } from "@/components/layouts/Sidebar";
import { SidebarProvider, useSidebar } from "@/components/layouts/SidebarContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main
        className={`
          transition-all duration-300 ease-in-out min-h-screen
          ${collapsed ? "pl-12" : "pl-60"}
        `}
      >
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
