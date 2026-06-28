"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Crosshair, Bot, CreditCard, ShoppingCart, Landmark, Wallet,
  ArrowRightLeft, CheckCircle2, PieChart, BarChart3, FileText, Settings, Hexagon,
  LogOut, User,
} from "lucide-react";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mission Control", href: "/mission-control", icon: Crosshair },
  { type: "divider" as const, label: "Agents" },
  { label: "Payment Agent", href: "/agents?agent=payment", icon: CreditCard },
  { label: "Procurement Agent", href: "/agents?agent=procurement", icon: ShoppingCart },
  { label: "Treasury Agent", href: "/agents?agent=treasury", icon: Landmark },
  { label: "Budget Agent", href: "/agents?agent=budget", icon: Wallet },
  { type: "divider" as const, label: "Operations" },
  { label: "Transactions", href: "/transactions", icon: ArrowRightLeft },
  { label: "Approvals", href: "/approvals", icon: CheckCircle2 },
  { label: "Wallets", href: "/wallets", icon: Wallet },
  { label: "Budgets", href: "/budgets", icon: PieChart },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Reports", href: "/reports", icon: FileText },
  { type: "divider" as const, label: "" },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-[260px] h-screen flex flex-col border-r border-border bg-[#0A0E1A] shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <Hexagon size={28} className="text-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot size={13} className="text-primary-light" />
            </div>
          </div>
          <div>
            <span className="text-[15px] font-bold tracking-tight text-foreground">HeliOS</span>
            <span className="block text-[9px] text-muted-dark font-medium uppercase tracking-[0.15em]">AI Financial OS</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map((item, i) => {
          if ("type" in item && item.type === "divider") {
            return (
              <div key={i} className="pt-4 pb-1.5 px-3">
                {item.label && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-dark">
                    {item.label}
                  </span>
                )}
              </div>
            );
          }

          if (!("href" in item)) return null;
          const Icon = item.icon;
          const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href.split("?")[0]);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary-light"
                  : "text-muted hover:text-foreground hover:bg-white/[0.03]"
              )}
            >
              <Icon size={16} className={cn(isActive ? "text-primary-light" : "text-muted-dark")} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-light" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile & logout */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        {session?.user && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User size={13} className="text-primary-light" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[12px] font-medium text-foreground truncate">{session.user.name || "User"}</span>
              <span className="block text-[10px] text-muted-dark truncate">{session.user.email}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium text-muted hover:text-danger hover:bg-danger/5 transition-all"
        >
          <LogOut size={14} className="text-muted-dark" />
          Sign Out
        </button>
        <div className="glass rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </div>
            <span className="text-[10px] font-medium text-foreground">All Systems Operational</span>
          </div>
          <span className="text-[9px] text-muted-dark font-mono">Arc Testnet</span>
        </div>
      </div>
    </aside>
  );
}
