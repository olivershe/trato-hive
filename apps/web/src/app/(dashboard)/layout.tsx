"use client";

import { Sidebar } from "@/components/layouts/Sidebar";
import { SidebarProvider, useSidebar } from "@/components/layouts/SidebarContext";
import { CommandPaletteProvider } from "@/components/CommandPaletteProvider";
import { AgentPicker } from "@/components/editor/AgentPicker";
import { useRecentTracker } from "@/hooks";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  // Track route visits for Recent section in sidebar
  useRecentTracker();

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
      <AgentPicker />
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
      <CommandPaletteProvider>
        <DashboardContent>{children}</DashboardContent>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
