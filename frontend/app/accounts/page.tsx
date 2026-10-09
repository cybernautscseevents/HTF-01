"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Filter, Search, User, ShieldAlert } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { AccountSummary, fetchAccounts } from "@/lib/api";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [total, setTotal] = useState(0);

  const loadAccounts = () => {
    setLoading(true);
    fetchAccounts({
      limit: 100,
      search: search.trim() || undefined,
      risk_filter: riskFilter === "ALL" ? undefined : riskFilter,
      sort_by: "final_score",
      sort_order: "desc",
    })
      .then((res) => {
        setAccounts(res.accounts);
        setTotal(res.total);
      })
      .catch((err) => console.error("Error loading accounts:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, [riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAccounts();
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              Account Registry
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Deterministic 100-pt heuristics & XGBoost binary classifier scored accounts ({total} total)
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5">
              <Search size={13} className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search account ID..."
                className="w-48 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter size={12} /> Risk Filter:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((level) => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={`rounded-lg px-3 py-1 font-medium transition ${
                riskFilter === level
                  ? "bg-blue-600 text-white"
                  : "border border-slate-800 bg-[#0b1621] text-slate-400 hover:text-white"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Accounts Table */}
        <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Evaluating accounts with XGBoost and Rule Engine...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No accounts matching the search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <tr>
                    <th className="pb-3">Account ID</th>
                    <th className="pb-3">Type / Tax Profile</th>
                    <th className="pb-3">Hybrid Score</th>
                    <th className="pb-3">Rule vs ML</th>
                    <th className="pb-3">Drain Ratio</th>
                    <th className="pb-3">Hold Time</th>
                    <th className="pb-3">Top Detected Indicator</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">
                  {accounts.map((acc) => {
                    const isCrit = acc.classification === "CRITICAL";
                    const isHigh = acc.classification === "HIGH";
                    return (
                      <tr key={acc.account_id} className="hover:bg-slate-900/40">
                        <td className="py-3 font-mono font-bold text-white">
                          {acc.account_id}
                        </td>

                        <td className="py-3">
                          {acc.is_gst_registered ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                              <Building2 size={12} /> GST Merchant (-10 pts)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <User size={12} /> Retail Individual
                            </span>
                          )}
                        </td>

                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isCrit
                                  ? "text-red-400"
                                  : isHigh
                                  ? "text-orange-400"
                                  : "text-blue-400"
                              }`}
                            >
                              {acc.final_score.toFixed(1)}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                isCrit
                                  ? "bg-red-500/10 text-red-400 border border-red-500/30"
                                  : isHigh
                                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {acc.classification}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 text-[11px] font-mono text-slate-400">
                          R: <span className="text-slate-200">{acc.rule_score}</span> · ML:{" "}
                          <span className="text-blue-400">{acc.ml_score}%</span>
                        </td>

                        <td className="py-3 font-mono text-slate-300">
                          {(acc.forwarding_ratio * 100).toFixed(0)}%
                        </td>

                        <td className="py-3 text-slate-300">
                          {acc.median_holding_time_hours < 1
                            ? `${(acc.median_holding_time_hours * 60).toFixed(0)}m`
                            : `${acc.median_holding_time_hours.toFixed(1)}h`}
                        </td>

                        <td className="py-3 text-[11px] text-slate-400 max-w-[220px] truncate">
                          {acc.top_reasons?.[0] || "Normal flow"}
                        </td>

                        <td className="py-3 text-right">
                          <Link
                            href={`/investigate`}
                            className="rounded bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-[11px] font-semibold text-blue-400 hover:bg-blue-600/30 transition"
                          >
                            Investigate →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}