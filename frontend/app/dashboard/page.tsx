"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ArrowLeftRight,
  Network,
  ShieldAlert,
  Sparkles,
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
  AiAnalysisSummary,
  fetchAiAnalysisSummary,
  fetchDashboardSnapshot,
} from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityTrendPoint[]>([]);
  const [topAccounts, setTopAccounts] = useState<AccountSummary[]>([]);
  const [networkCases, setNetworkCases] = useState<NetworkCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiAnalysisSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [refreshKey] = useState(0);

  useEffect(() => {
    // The backend keeps the analyzed dataset in its store while the app runs.
    // Rehydrate this page whenever navigation remounts the dashboard.
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetchDashboardSnapshot()
      .then((data) => {
        if (!data) {
          setStats(null);
          setActivity([]);
          setTopAccounts([]);
          setNetworkCases([]);
          setHasAnalysis(false);
          return;
        }
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
      setAiSummary(null);
      setAiError("");
    }
  };

  const handleGenerateSummary = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      setAiSummary(await fetchAiAnalysisSummary());
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to generate AI summary.");
    } finally {
      setAiLoading(false);
    }
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

        {/* <section className="rounded-xl border border-indigo-500/25 bg-gradient-to-br from-[#0b1424] to-[#071019] p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-300" />
                <h3 className="text-sm font-semibold text-white">Grounded AI Investigation Summary</h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Summarizes only the completed rule-engine, ML, risk, and network evidence.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={aiLoading}
              className="flex items-center justify-center gap-2 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={14} />
              {aiLoading ? "Analyzing Evidence..." : aiSummary ? "Refresh Summary" : "Generate Summary"}
            </button>
          </div>

          {aiError && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {aiError}
            </p>
          )}

          {aiSummary && (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-sm leading-6 text-slate-200">{aiSummary.summary}</p>
                <h4 className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Key Findings
                </h4>
                <ul className="mt-2 space-y-2 text-xs text-slate-300">
                  {aiSummary.key_findings.map((finding, index) => (
                    <li key={`${finding}-${index}`} className="flex gap-2">
                      <span className="text-indigo-300">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-800 bg-black/10 p-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  High-Priority Networks
                </h4>
                <div className="mt-2 space-y-2">
                  {aiSummary.high_priority_networks.length === 0 ? (
                    <p className="text-xs text-slate-500">No high-priority networks were returned.</p>
                  ) : aiSummary.high_priority_networks.map((network) => (
                    <div key={network.case_id} className="rounded-md border border-slate-800 px-3 py-2">
                      <div className="flex justify-between gap-3 text-xs">
                        <span className="font-medium text-slate-200">{network.case_id}</span>
                        <span className="text-red-300">{network.risk_score}/100</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">{network.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section> */}

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