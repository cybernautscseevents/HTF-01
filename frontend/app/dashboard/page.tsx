"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ArrowLeftRight,
  Network,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import CsvUploader, { CsvProcessingResult } from "@/components/dashboard/CsvUploader";
import StatCard from "@/components/dashboard/StatCard";
import ActivityChart from "@/components/dashboard/ActivityChart";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import RecentCases from "@/components/dashboard/RecentCases";
import TopAccounts from "@/components/dashboard/TopAccounts";
import {
  AccountSummary,
  ActivityTrendPoint,
  DashboardStats,
  NetworkCase,
  fetchDashboardSnapshot,
} from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityTrendPoint[]>([]);
  const [topAccounts, setTopAccounts] = useState<AccountSummary[]>([]);
  const [networkCases, setNetworkCases] = useState<NetworkCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // The backend keeps the analyzed dataset in its store while the app runs.
    // Rehydrate this page whenever navigation remounts the dashboard.
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetchDashboardSnapshot()
      .then((data) => {
        setStats(data.stats);
        setActivity(data.activity);
        setTopAccounts(data.top_accounts);
        setNetworkCases(data.network_cases);
        setHasAnalysis(true);
      })
      .catch((err) => console.error("Error loading processed dashboard data:", err))
      .finally(() => setLoading(false));
  };

  const handleDataLoaded = (result: CsvProcessingResult) => {
    // The upload response is returned only after backend parsing, ML inference,
    // and rule scoring. Fetch the complete dashboard snapshot after that point.
    setStats(result.stats);
    setActivity([]);
    setTopAccounts([]);
    setNetworkCases([]);
    setHasAnalysis(false);
    loadData();
  };

  const handleProcessingChange = (isProcessing: boolean) => {
    setLoading(isProcessing);
    if (isProcessing) {
      setHasAnalysis(false);
      setStats(null);
      setActivity([]);
      setTopAccounts([]);
      setNetworkCases([]);
    }
  };

  const handleRefresh = () => {
    if (!hasAnalysis) return;
    setRefreshKey((k) => k + 1);
    loadData();
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

          {hasAnalysis && (
            <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Sync Dashboard
            </button>
          )}
        </div>

        {/* CSV Upload & Demo Feed Ingestion */}
        <CsvUploader
          onDataLoaded={handleDataLoaded}
          onProcessingChange={handleProcessingChange}
        />

        {hasAnalysis && (
          <>
        {/* Live Real Statistics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Accounts"
            value={stats ? stats.total_accounts.toLocaleString() : "—"}
            change={stats ? `${stats.gst_merchants} GST Verified` : "Waiting for analysis"}
            positive={true}
            icon={Users}
          />

          <StatCard
            title="Total Transactions"
            value={stats ? stats.total_transactions.toLocaleString() : "—"}
            change={
              stats?.total_volume
                ? `₹${(stats.total_volume / 100000).toFixed(1)}L Vol`
                : stats
                ? "Active"
                : "Waiting for analysis"
            }
            positive={true}
            icon={ArrowLeftRight}
          />

          <StatCard
            title="Critical Risk Mules"
            value={stats ? stats.critical_accounts.toString() : "—"}
            change="Immediate Freeze"
            positive={false}
            icon={ShieldAlert}
          />

          <StatCard
            title="Flagged Conduit Accounts"
            value={stats ? stats.flagged_accounts.toString() : "—"}
            change="AML Queue"
            positive={false}
            icon={Network}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          <ActivityChart data={activity} loading={loading} key={`act-${refreshKey}`} />
          <RiskDistribution stats={stats} loading={loading} key={`dist-${refreshKey}`} />
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
          <RecentCases cases={networkCases} loading={loading} key={`cases-${refreshKey}`} />
          <TopAccounts cases={networkCases} loading={loading} key={`top-${refreshKey}`} />
        </div>
          </>
        )}
      </div>
    </AppShell>
  );
}