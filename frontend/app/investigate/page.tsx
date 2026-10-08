"use client";

import { useState } from "react";
import {
  Building2,
  GitFork,
  Layers,
  Network,
  Play,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import NetworkGraph from "@/components/investigation/NetworkGraph";
import AccountPanel from "@/components/investigation/AccountPanel";
import MoneyTrail from "@/components/timeline/MoneyTrail";
import { loadDemoDataset } from "@/lib/api";

export default function InvestigatePage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("MULE_RAPID_047");
  const [inputAccount, setInputAccount] = useState("MULE_RAPID_047");
  const [showTrail, setShowTrail] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setInputAccount(id);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAccount.trim()) {
      setSelectedAccountId(inputAccount.trim());
    }
  };

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      await loadDemoDataset();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to reload demo data:", err);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Network className="text-blue-500" size={22} />
              Financial Crime Network Investigation
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              Interactive multi-directional graph visualizer powered by 100-Point Rule Engine & XGBoost
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemo}
              disabled={loadingDemo}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-white"
            >
              <RefreshCw size={13} className={loadingDemo ? "animate-spin text-blue-400" : ""} />
              {loadingDemo ? "Reloading..." : "Reset Demo Data"}
            </button>
            <button
              onClick={() => setShowTrail(!showTrail)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                showTrail
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "border border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
              }`}
            >
              <ReceiptText size={14} />
              {showTrail ? "Hide Money Trail" : "View Money Trail"}
            </button>
          </div>
        </div>

        {/* Quick Scenario Preset Selector */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-[#071019] p-3 text-xs">
          <span className="font-semibold text-slate-400 text-[11px] pr-2">Quick Scenarios:</span>
          
          <button
            onClick={() => handleSelectAccount("MULE_RAPID_047")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selectedAccountId === "MULE_RAPID_047"
                ? "bg-red-500/20 text-red-300 border border-red-500/50"
                : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            🚨 MULE_RAPID_047 (Rapid Drain Mule)
          </button>

          <button
            onClick={() => handleSelectAccount("MULE_FUNNEL_103")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selectedAccountId === "MULE_FUNNEL_103"
                ? "bg-red-500/20 text-red-300 border border-red-500/50"
                : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            🌪️ MULE_FUNNEL_103 (Fan-In Aggregator)
          </button>

          <button
            onClick={() => handleSelectAccount("MULE_CYCLE_X_301")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selectedAccountId === "MULE_CYCLE_X_301"
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/50"
                : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            🔄 MULE_CYCLE_X_301 (Circular Loop)
          </button>

          <button
            onClick={() => handleSelectAccount("MERCHANT_SUPERMART_01")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              selectedAccountId === "MERCHANT_SUPERMART_01"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
            }`}
          >
            ✅ MERCHANT_SUPERMART_01 (GST Merchant Credit)
          </button>
        </div>

        {/* Central Investigation Workspace: Graph (Left) + Account Panel (Right) */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
          {/* Left Canvas: Interactive Network Graph */}
          <div className="min-h-[580px]">
            <NetworkGraph
              key={refreshKey}
              selectedAccountId={selectedAccountId}
              onSelectAccount={handleSelectAccount}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          </div>

          {/* Right Sidebar: Deep Account Evidence Card */}
          <div>
            <AccountPanel
              accountId={selectedAccountId}
              onSelectNextHop={handleSelectAccount}
            />
          </div>
        </div>

        {/* Bottom Section: Reconstructed Money Trail Timeline */}
        {showTrail && (
          <div className="pt-2">
            <MoneyTrail seedId={selectedAccountId} />
          </div>
        )}
      </div>
    </AppShell>
  );
}