"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Cpu,
  Layers,
  Network,
  Repeat,
  ShieldAlert,
  User,
  Zap,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { AccountDetail, fetchAccountRisk } from "@/lib/api";

function AccountDetailContent() {
  const params = useParams();
  const accountId = (params?.accountId as string) || "";

  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "factors" | "nexthops" | "txns">("overview");

  useEffect(() => {
    if (!accountId) return;
    setLoading(true);
    fetchAccountRisk(accountId)
      .then((res) => setData(res))
      .catch((err) => {
        console.error("Error fetching account:", err);
        setError("Account details could not be found.");
      })
      .finally(() => setLoading(false));
  }, [accountId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-xs text-slate-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-3" />
        Loading account risk profile...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center text-sm text-red-400">
        {error || "Account not found"}
        <div className="mt-4">
          <Link href="/accounts" className="text-xs text-blue-400 hover:underline">
            ← Return to Accounts Registry
          </Link>
        </div>
      </div>
    );
  }

  const isCrit = data.classification === "CRITICAL";
  const isHigh = data.classification === "HIGH";

  return (
    <div className="space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition mb-3"
          >
            <ArrowLeft size={13} /> Back to Accounts Registry
          </Link>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                  isCrit
                    ? "border-red-500/40 bg-red-500/10 text-red-400"
                    : isHigh
                    ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                    : "border-blue-500/40 bg-blue-500/10 text-blue-400"
                }`}
              >
                <ShieldAlert size={24} />
              </div>

              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-white tracking-wide">
                    {data.account_id}
                  </h1>

                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      isCrit
                        ? "border-red-500/40 bg-red-500/10 text-red-400"
                        : isHigh
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                        : "border-blue-500/40 bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {data.classification} RISK
                  </span>

                  {data.is_gst_registered ? (
                    <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                      <Building2 size={12} /> GST Verified Merchant (-10 pts)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-300">
                      <User size={12} /> Retail Individual
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  {data.top_reasons?.[0] || "Financial crime monitoring entity record"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/investigate`}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-lg"
              >
                <Network size={14} />
                Open in Graph Canvas
              </Link>
            </div>
          </div>
        </div>

        {/* Risk Scores KPI Strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-4">
            <span className="text-[11px] font-medium text-slate-400">Final Hybrid Score</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-black ${
                  isCrit ? "text-red-400" : isHigh ? "text-orange-400" : "text-blue-400"
                }`}
              >
                {data.final_score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-600">/ 100</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  isCrit ? "bg-red-500" : isHigh ? "bg-orange-500" : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(data.final_score, 100)}%` }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-4">
            <span className="text-[11px] font-medium text-slate-400">Deterministic Rule Points</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-200">
                {data.rule_score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-600">pts</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              6 behavioral & topological dimensions
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-4">
            <span className="text-[11px] font-medium text-slate-400">XGBoost ML Probability</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-400">
                {(data.mule_probability * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500 font-mono">P={data.mule_probability.toFixed(3)}</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              ML Score: {data.ml_score.toFixed(1)} pts
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-4">
            <span className="text-[11px] font-medium text-slate-400">Forwarding Drain Rate</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">
                {(data.forwarding_ratio * 100).toFixed(0)}%
              </span>
              <span className="text-xs text-slate-500">outbound</span>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Median hold:{" "}
              {data.median_holding_time_hours < 1
                ? `${(data.median_holding_time_hours * 60).toFixed(0)}m`
                : `${data.median_holding_time_hours.toFixed(1)}h`}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 text-xs">
          {[
            { id: "overview", label: "Overview & Top Metrics" },
            { id: "factors", label: `Rule Factors (${data.rule_factors?.length || 0})` },
            { id: "nexthops", label: `Downstream Next Hops (${data.next_hops?.length || 0})` },
            { id: "txns", label: `Transaction History (${data.recent_transactions?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`border-b-2 px-5 py-3 font-semibold transition ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 6 Dimension Breakdown */}
            <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-white mb-4">
                Deterministic Rule Dimension Breakdown
              </h3>
              <div className="space-y-3.5">
                {Object.entries(data.dimension_scores || {}).map(([dim, score]) => {
                  const maxPts =
                    dim === "pass_through"
                      ? 25
                      : dim === "temporal_anomaly"
                      ? 20
                      : dim === "counterparty_anomaly"
                      ? 15
                      : dim === "network_topology"
                      ? 25
                      : dim === "circular_flow"
                      ? 10
                      : 5;
                  const ratio = Math.min(Math.max(score / maxPts, 0), 1);
                  return (
                    <div key={dim}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-slate-300">
                          {dim.replace("_", " ")}
                        </span>
                        <span className="font-mono font-bold text-slate-200">
                          {score} / {maxPts} pts
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            score > maxPts * 0.6
                              ? "bg-red-500"
                              : score > 0
                              ? "bg-amber-500"
                              : score < 0
                              ? "bg-emerald-500"
                              : "bg-slate-700"
                          }`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top ML Feature Importances */}
            <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-1.5">
                <Cpu size={14} className="text-blue-400" />
                Top XGBoost Model Feature Contributions
              </h3>
              <div className="space-y-2">
                {data.top_ml_features?.map((feat) => (
                  <div
                    key={feat.feature}
                    className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-[#071019] px-3 py-2 text-xs"
                  >
                    <div>
                      <span className="font-mono text-slate-300">{feat.feature}</span>
                      <p className="text-[10px] text-slate-500">
                        Model Gain Weight: {(feat.model_importance * 100).toFixed(1)}%
                      </p>
                    </div>
                    <span className="font-mono font-bold text-blue-400">
                      {typeof feat.value === "number" ? feat.value.toFixed(2) : feat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Rule Factors */}
        {activeTab === "factors" && (
          <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-4">
              All Contributing Factor Evidence & Audit Trail
            </h3>
            <div className="space-y-2.5">
              {data.rule_factors?.map((f) => {
                const isCredit = f.points < 0;
                return (
                  <div
                    key={f.key}
                    className={`rounded-lg border p-3.5 transition text-xs ${
                      isCredit
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                        : f.points >= 10
                        ? "border-red-500/30 bg-red-500/5 text-red-300"
                        : f.points > 0
                        ? "border-orange-500/30 bg-orange-500/5 text-orange-300"
                        : "border-slate-800 bg-slate-900/30 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{f.name}</span>
                      <span className="font-mono text-sm">
                        {f.points > 0 ? `+${f.points}` : f.points} pts
                      </span>
                    </div>
                    <p className="mt-1 text-xs opacity-80 leading-relaxed">
                      {f.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Next Hops */}
        {activeTab === "nexthops" && (
          <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-3">
              Predicted Downstream Next-Hop Accounts
            </h3>
            <div className="space-y-3">
              {data.next_hops?.map((hop, idx) => (
                <div
                  key={hop.candidate_account}
                  className="rounded-lg border border-slate-800 bg-[#071019] p-4 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">
                      #{idx + 1} · {hop.candidate_account}
                    </span>
                    <span className="font-mono text-blue-400">
                      Confidence: {hop.next_hop_score}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-slate-400">
                    <span>Transfers: {hop.transfer_count} times</span>
                    <span className="font-semibold text-amber-400">
                      Risk: {hop.receiver_risk_score} pts ({hop.receiver_classification})
                    </span>
                  </div>
                  <ul className="mt-2 list-disc list-inside text-slate-500 text-[11px]">
                    {hop.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Transactions */}
        {activeTab === "txns" && (
          <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl overflow-x-auto">
            <h3 className="text-sm font-semibold text-white mb-3">
              Recent Transaction Log
            </h3>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-500 text-[11px]">
                <tr>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Counterparty</th>
                  <th className="pb-2.5">Timestamp</th>
                  <th className="pb-2.5">Channel</th>
                  <th className="pb-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.recent_transactions?.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-900/40">
                    <td className="py-2.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          tx.direction === "INCOMING"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {tx.direction}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-200">
                      {tx.counterparty}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">{tx.channel}</td>
                    <td className="py-2.5 font-mono font-bold text-right text-emerald-400">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}

export default function AccountDetailPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex h-96 items-center justify-center text-xs text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-3" />
            Loading account profile...
          </div>
        }
      >
        <AccountDetailContent />
      </Suspense>
    </AppShell>
  );
}