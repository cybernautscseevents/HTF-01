"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  GitFork,
  Layers,
  Network,
  Pause,
  Play,
  ReceiptText,
  ShieldAlert,
  Zap,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import NetworkGraph from "@/components/investigation/NetworkGraph";
import AccountPanel from "@/components/investigation/AccountPanel";
import MoneyTrail from "@/components/timeline/MoneyTrail";
import { AccountSummary, MoneyTrailData, fetchAccountTrail, fetchAccounts } from "@/lib/api";

interface Scenario {
  icon: string;
  label: string;
  accountId: string;
  tone: "red" | "orange" | "blue" | "green";
}

export default function InvestigatePage() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [simulationTrail, setSimulationTrail] = useState<MoneyTrailData | null>(null);
  const [simulationHopIndex, setSimulationHopIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationError, setSimulationError] = useState("");

  useEffect(() => {
    fetchAccounts({ limit: 500 })
      .then(({ accounts }) => {
        const find = (predicate: (account: AccountSummary) => boolean) =>
          accounts.find(predicate) || accounts[0];
        const next: Array<Omit<Scenario, "accountId"> & { accountId?: string }> = [
          { icon: "🚨", label: "Rapid Drain Mule", accountId: find((a) => a.forwarding_ratio >= 0.8)?.account_id, tone: "red" as const },
          { icon: "🌪️", label: "Fan-In Aggregator", accountId: find((a) => a.unique_senders > a.unique_receivers && a.unique_senders >= 3)?.account_id, tone: "orange" as const },
          { icon: "🔄", label: "Circular Loop", accountId: find((a) => a.cycle_count > 0)?.account_id, tone: "orange" as const },
          { icon: "✅", label: "GST Merchant Credit", accountId: find((a) => a.is_gst_registered)?.account_id, tone: "green" as const },
        ];
        const available = next.filter((scenario): scenario is Scenario => Boolean(scenario.accountId));
        setScenarios(available);
        if (available[0]) {
          setSelectedAccountId((current) => current || available[0].accountId);
        }
      })
      .catch(() => setScenarios([]));
  }, [refreshKey]);

  const handleSelectAccount = (id: string) => {
    setSelectedAccountId(id);
    setIsSimulating(false);
    setSimulationTrail(null);
    setSimulationHopIndex(0);
    setSimulationError("");
  };

  useEffect(() => {
    if (!isSimulating || !simulationTrail?.trail.length) return;

    const timer = setInterval(() => {
      setSimulationHopIndex((current) =>
        current >= simulationTrail.trail.length - 1 ? 0 : current + 1,
      );
    }, 1900);

    return () => clearInterval(timer);
  }, [isSimulating, simulationTrail]);

  const handleSimulation = async () => {
    if (isSimulating) {
      setIsSimulating(false);
      return;
    }

    if (simulationTrail?.trail.length) {
      setIsSimulating(true);
      return;
    }

    if (!selectedAccountId) return;

    setSimulationLoading(true);
    setSimulationError("");
    try {
      const trail = await fetchAccountTrail(selectedAccountId);
      if (!trail.trail.length) {
        setSimulationError("No transaction trail is available for this account.");
        return;
      }
      setSimulationTrail(trail);
      setSimulationHopIndex(0);
      setIsSimulating(true);
    } catch (error) {
      setSimulationError(
        error instanceof Error ? error.message : "Unable to load simulation trail.",
      );
    } finally {
      setSimulationLoading(false);
    }
  };

  const activeSimulationHop =
    isSimulating && simulationTrail?.trail
      ? simulationTrail.trail[simulationHopIndex]
      : null;

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

        </div>

        {/* Quick Scenario Preset Selector */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-[#071019] p-3 text-xs">
          <span className="font-semibold text-slate-400 text-[11px] pr-2">Quick Scenarios:</span>
          {scenarios.length === 0 ? (
            <span className="text-[11px] text-slate-500">Upload a CSV on the dashboard to generate scenarios.</span>
          ) : scenarios.map((scenario) => (
            <button
              key={`${scenario.label}-${scenario.accountId}`}
              onClick={() => handleSelectAccount(scenario.accountId)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                selectedAccountId === scenario.accountId
                  ? scenario.tone === "green"
                    ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                    : "border-red-500/50 bg-red-500/20 text-red-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white"
              }`}
            >
              {scenario.icon} {scenario.accountId} ({scenario.label})
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-[#071019] p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] text-slate-400">
            Replay downstream money movement for the selected account.
          </span>
          <button
            type="button"
            onClick={handleSimulation}
            disabled={simulationLoading || !selectedAccountId}
            className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
              isSimulating
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-indigo-500/50 hover:text-white"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            {simulationLoading
              ? "Loading Simulation..."
              : isSimulating
                ? "Pause Simulation"
                : simulationTrail
                  ? "Resume Simulation"
                  : "Run Simulation"}
          </button>
        </div>

        {simulationError && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {simulationError}
          </p>
        )}

        {activeSimulationHop && (
          <div className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 font-mono text-[11px] text-indigo-300">
            <Zap size={13} />
            Hop #{activeSimulationHop.hop}: {activeSimulationHop.sender_id} →{" "}
            {activeSimulationHop.receiver_id} (₹{activeSimulationHop.amount.toLocaleString("en-IN")})
          </div>
        )}

        {/* Central Investigation Workspace: Graph (Left) + Account Panel (Right) */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
          {/* Left Canvas: Interactive Network Graph */}
          <div className="min-h-[580px]">
            <NetworkGraph
              key={refreshKey}
              selectedAccountId={selectedAccountId}
              onSelectAccount={handleSelectAccount}
              onRefresh={() => setRefreshKey((k) => k + 1)}
              activeSimulationHop={activeSimulationHop}
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

        <div className="flex justify-center border-t border-slate-800 pt-5">
          <button
            onClick={() => setShowNetworkDetails((visible) => !visible)}
            className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-5 py-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20"
          >
            <ReceiptText size={15} />
            {showNetworkDetails ? "Hide Network Details" : "Load Network Details"}
          </button>
        </div>

        {showNetworkDetails && (
          <div className="pt-1">
            <MoneyTrail />
          </div>
        )}

      </div>
    </AppShell>
  );
}