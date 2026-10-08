import {
  Users,
  ArrowLeftRight,
  Network,
  ShieldAlert,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import ActivityChart from "@/components/dashboard/ActivityChart";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import RecentCases from "@/components/dashboard/RecentCases";
import TopAccounts from "@/components/dashboard/TopAccounts";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5">

        {/* Page heading */}
        <div>
          <h2 className="text-lg font-semibold text-white">
            Dashboard
          </h2>

          <p className="text-xs text-slate-500">
            Overall statistics and recent suspicious networks
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Accounts"
            value="12,458"
            change="12%"
            icon={Users}
          />

          <StatCard
            title="Transactions"
            value="84,320"
            change="20%"
            icon={ArrowLeftRight}
          />

          <StatCard
            title="Suspicious Networks"
            value="28"
            change="4 new"
            positive={false}
            icon={Network}
          />

          <StatCard
            title="High Risk Accounts"
            value="126"
            change="18%"
            positive={false}
            icon={ShieldAlert}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <ActivityChart />
          <RiskDistribution />
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
          <RecentCases />
          <TopAccounts />
        </div>

      </div>
    </AppShell>
  );
}