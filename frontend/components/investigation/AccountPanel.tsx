"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Cpu,
  Layers,
  Repeat,
  ShieldAlert,
  Sliders,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { AccountDetail, fetchAccountRisk } from "@/lib/api";

interface AccountPanelProps {
  accountId?: string | null;
  onSelectNextHop?: (accountId: string) => void;
}

export default function AccountPanel({
  accountId,
  onSelectNextHop,
}: AccountPanelProps) {
  const [activeTab, setActiveTab] = useState<"evidence" | "nexthops" | "txns">("evidence");
  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setData(null);
    setError(null);
    setActiveTab("evidence");

    if (!accountId) {
      setLoading(false);
      return () => controller.abort();
    }

    setLoading(true);
    fetchAccountRisk(accountId, controller.signal)
      .then((res) => setData(res))
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load account:", err);
        setError("Account details could not be loaded");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [accountId]);

  if (!accountId) {
    return (
      <aside className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0b1621] p-8 text-center text-slate-500">
        <User size={36} className="text-slate-600 mb-3" />
        <p className="text-sm font-medium text-slate-300">No Account Selected</p>
        <p className="mt-1 text-xs text-slate-500">
          Click any node on the graph canvas or search an account ID to inspect full risk evidence.
        </p>
      </aside>
    );
  }

  if (loading) {
    return (
      <aside className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#0b1621] p-8 text-center text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mb-3" />
        <p className="text-xs">Computing hybrid risk signals...</p>
      </aside>
    );
  }

  if (error || !data) {
    return (
      <aside className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
        {error || "Account not found"}
      </aside>
    );
  }

  const getBadgeStyle = (classification: string) => {
    switch (classification) {
      case "CRITICAL":
        return "border-red-500/40 bg-red-500/10 text-red-400";
      case "HIGH":
        return "border-orange-500/40 bg-orange-500/10 text-orange-400";
      case "MEDIUM":
        return "border-amber-500/40 bg-amber-500/10 text-amber-400";
      default:
        return "border-blue-500/40 bg-blue-500/10 text-blue-400";
    }
  };

  return (
    <aside className="flex flex-col rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-2xl overflow-y-auto max-h-[800px]">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-wide">
              {data.account_id}
            </h3>
            {data.is_gst_registered ? (
              <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <Building2 size={11} /> GST Merchant
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-300">
                <User size={11} /> Individual
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {data.is_gst_registered
              ? "Verified active trade taxpayer profile (Applies -10 pts risk mitigation credit)"
              : "Retail bank account profile"}
          </p>
        </div>

        <span className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getBadgeStyle(data.classification)}`}>
          {data.classification}
        </span>
      </div>

      {/* Hybrid Score Gauge */}
      <div className="mt-4 rounded-lg border border-slate-800/90 bg-[#071019] p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-400">Hybrid Risk Score</span>
          <span className="text-base font-black text-white">
            {data.final_score.toFixed(1)} <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              data.final_score >= 75
                ? "bg-red-500"
                : data.final_score >= 50
                ? "bg-orange-500"
                : data.final_score >= 25
                ? "bg-amber-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(data.final_score, 100)}%` }}
          />
        </div>

        {/* Score Component Breakdown */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/60 pt-3 text-[11px]">
          <div className="flex flex-col">
            <span className="text-slate-500">Deterministic Rules:</span>
            <span className="font-mono font-bold text-slate-200">
              {data.rule_score.toFixed(1)} pts
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">XGBoost ML Score:</span>
            <span className="font-mono font-bold text-blue-400">
              {data.ml_score.toFixed(1)}% <span className="text-[10px] text-slate-500">(P={data.mule_probability.toFixed(3)})</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 grid grid-cols-3 rounded-lg border border-slate-800 bg-[#071019] p-1 text-xs">
        <button
          onClick={() => setActiveTab("evidence")}
          className={`rounded-md py-1.5 font-medium transition ${
            activeTab === "evidence" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Risk Evidence
        </button>
        <button
          onClick={() => setActiveTab("nexthops")}
          className={`rounded-md py-1.5 font-medium transition ${
            activeTab === "nexthops" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Next Hops ({data.next_hops?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("txns")}
          className={`rounded-md py-1.5 font-medium transition ${
            activeTab === "txns" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Txns ({data.recent_transactions?.length || 0})
        </button>
      </div>

      {/* Tab 1: Risk Evidence */}
      {activeTab === "evidence" && (
        <div className="mt-4 space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded border border-slate-800 bg-slate-900/40 p-2">
              <span className="text-slate-500">Forwarding Drain:</span>
              <p className="font-semibold text-slate-200">
                {(data.forwarding_ratio * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900/40 p-2">
              <span className="text-slate-500">Median Hold Time:</span>
              <p className="font-semibold text-slate-200">
                {data.median_holding_time_hours < 1
                  ? `${(data.median_holding_time_hours * 60).toFixed(0)} mins`
                  : `${data.median_holding_time_hours.toFixed(1)} hrs`}
              </p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900/40 p-2">
              <span className="text-slate-500">Senders / Receivers:</span>
              <p className="font-semibold text-slate-200">
                {data.unique_senders} in / {data.unique_receivers} out
              </p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900/40 p-2">
              <span className="text-slate-500">Layering Hops:</span>
              <p className="font-semibold text-slate-200">
                Depth {data.layering_depth} {data.cycle_count > 0 ? `· ${data.cycle_count} Cycle(s)` : ""}
              </p>
            </div>
          </div>

          {/* Contributing Rule Factors */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-amber-400" />
              Deterministic Rule Breakdown
            </h4>
            <div className="space-y-1.5">
              {data.rule_factors?.map((factor) => {
                const isCredit = factor.points < 0;
                const isZero = factor.points === 0;
                return (
                  <div
                    key={factor.key}
                    className={`rounded-lg border p-2.5 text-xs transition ${
                      isCredit
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                        : isZero
                        ? "border-slate-800/80 bg-slate-900/20 text-slate-400"
                        : factor.points >= 10
                        ? "border-red-500/30 bg-red-500/5 text-red-300"
                        : "border-orange-500/30 bg-orange-500/5 text-orange-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-medium">
                      <span>{factor.name}</span>
                      <span className="font-mono font-bold">
                        {factor.points > 0 ? `+${factor.points}` : factor.points} pts
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] opacity-80 leading-relaxed">
                      {factor.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top ML Features */}
          {data.top_ml_features && data.top_ml_features.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Cpu size={13} className="text-blue-400" />
                Top XGBoost Feature Signals
              </h4>
              <div className="space-y-1 text-xs">
                {data.top_ml_features.map((feat) => (
                  <div
                    key={feat.feature}
                    className="flex items-center justify-between rounded border border-slate-800 bg-[#071019] px-2.5 py-1.5 text-[11px]"
                  >
                    <span className="font-mono text-slate-400">{feat.feature}</span>
                    <span className="font-semibold text-slate-200">
                      {typeof feat.value === "number" ? feat.value.toFixed(2) : feat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Next Hops */}
      {activeTab === "nexthops" && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] text-slate-400 mb-2">
            Downstream accounts ranked by likelihood of receiving next laundering hop:
          </p>
          {data.next_hops && data.next_hops.length > 0 ? (
            data.next_hops.map((hop, idx) => (
              <div
                key={hop.candidate_account}
                onClick={() => onSelectNextHop && onSelectNextHop(hop.candidate_account)}
                className="cursor-pointer rounded-lg border border-slate-800 bg-[#071019] p-3 transition hover:border-blue-500/50 hover:bg-slate-900/60"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                    <span>{hop.candidate_account}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-blue-400">
                    Confidence: {hop.next_hop_score}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Last transfer: ₹{hop.last_transfer_amount.toLocaleString()}</span>
                  <span className={`font-semibold ${hop.receiver_classification === "CRITICAL" ? "text-red-400" : "text-amber-400"}`}>
                    {hop.receiver_classification} ({hop.receiver_risk_score} pts)
                  </span>
                </div>
                <ul className="mt-2 list-disc list-inside text-[10px] text-slate-500">
                  {hop.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-slate-800 p-4 text-center text-xs text-slate-500">
              No recent downstream receivers found for this account.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Transactions */}
      {activeTab === "txns" && (
        <div className="mt-4 space-y-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="pb-1.5 font-medium">Type</th>
                  <th className="pb-1.5 font-medium">Counterparty</th>
                  <th className="pb-1.5 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {data.recent_transactions?.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-900/40">
                    <td className="py-1.5">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          tx.direction === "INCOMING"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {tx.direction === "INCOMING" ? "IN" : "OUT"}
                      </span>
                    </td>
                    <td className="py-1.5 font-mono text-slate-300">
                      {tx.counterparty}
                    </td>
                    <td className="py-1.5 font-mono font-semibold text-right text-white">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </aside>
  );
}