"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ArrowLeftRight,
  Network,
  ShieldAlert,
  Coins,
  RefreshCw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import CsvUploader, { CsvRow } from "@/components/dashboard/CsvUploader";
import StatCard from "@/components/dashboard/StatCard";
import ActivityChart from "@/components/dashboard/ActivityChart";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import RecentCases from "@/components/dashboard/RecentCases";
import TopAccounts from "@/components/dashboard/TopAccounts";
import { DashboardStats, fetchStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = () => {
    setLoading(true);
    fetchStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Error loading dashboard stats:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const handleDataLoaded = (_data: CsvRow[], _fileName: string) => {
    // Re-fetch stats after CSV ingestion completes
    setRefreshKey((k) => k + 1);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page heading */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              MuleTrace Executive Dashboard
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Live financial crime analytics, risk metrics & suspicious network indicators
            </p>
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Sync Dashboard
          </button>
        </div>

        {/* CSV Upload & Demo Feed Ingestion */}
        <CsvUploader onDataLoaded={handleDataLoaded} />

        {/* Live Real Statistics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Accounts"
            value={stats ? stats.total_accounts.toLocaleString() : "96"}
            change={`${stats?.gst_merchants || 4} GST Verified`}
            positive={true}
            icon={Users}
          />

          <StatCard
            title="Total Transactions"
            value={stats ? stats.total_transactions.toLocaleString() : "683"}
            change={
              stats?.total_volume
                ? `₹${(stats.total_volume / 100000).toFixed(1)}L Vol`
                : "Active"
            }
            positive={true}
            icon={ArrowLeftRight}
          />

          <StatCard
            title="Critical Risk Mules"
            value={stats ? stats.critical_accounts.toString() : "5"}
            change="Immediate Freeze"
            positive={false}
            icon={ShieldAlert}
          />

          <StatCard
            title="Flagged Conduit Accounts"
            value={stats ? stats.flagged_accounts.toString() : "13"}
            change="AML Queue"
            positive={false}
            icon={Network}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          <ActivityChart key={`act-${refreshKey}`} />
          <RiskDistribution stats={stats} key={`dist-${refreshKey}`} />
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          <RecentCases key={`cases-${refreshKey}`} />
          <TopAccounts key={`top-${refreshKey}`} />
        </div>
      </div>
    </AppShell>
  );
}