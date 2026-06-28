"use client";

import Sidebar from "@/components/layout/Sidebar";
import NotificationBell from "@/components/ui/NotificationBell";
import { useState } from "react";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on mobile, static on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#0A0E1A]/95 backdrop-blur border-b border-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted hover:text-foreground transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-foreground flex-1">HeliOS</span>
          <NotificationBell />
        </div>
        {/* Desktop notification bar */}
        <div className="hidden lg:flex items-center justify-end px-8 py-2 border-b border-border/50">
          <NotificationBell />
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
