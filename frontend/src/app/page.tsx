"use client";

import KpiCards from "@/components/dashboard/KpiCards";
import TractionBanner from "@/components/dashboard/TractionBanner";
import SpendingChart from "@/components/dashboard/SpendingChart";
import CostBreakdownChart from "@/components/dashboard/CostBreakdownChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import {
  kpis, tractionMetrics, spendingData, costBreakdown, transactions, activityFeed,
} from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-dark mt-1">Autonomous financial operations overview</p>
      </div>

      {/* Traction */}
      <TractionBanner data={tractionMetrics} />

      {/* KPIs */}
      <KpiCards data={kpis} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <SpendingChart data={spendingData} />
        </div>
        <div className="lg:col-span-2">
          <CostBreakdownChart data={costBreakdown} />
        </div>
      </div>

      {/* Activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions data={transactions} />
        <ActivityFeed data={activityFeed} />
      </div>
    </div>
  );
}
