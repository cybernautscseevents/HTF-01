"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, GripVertical, Loader2, RefreshCw, Search, ShieldAlert, SlidersHorizontal, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { AccountSummary, fetchAccounts, overrideAccountClassification } from "@/lib/api";

type Level = AccountSummary["classification"];

const levels: Level[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const levelConfig: Record<Level, {
  title: string;
  range: string;
  accent: string;
  dot: string;
  badge: string;
  guidance: string;
}> = {
  LOW: {
    title: "Low Risk",
    range: "< 25",
    accent: "border-blue-500/25",
    dot: "bg-blue-500",
    badge: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    guidance: "Safe / Feeder",
  },
  MEDIUM: {
    title: "Medium Risk",
    range: "25–49",
    accent: "border-amber-500/25",
    dot: "bg-amber-500",
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    guidance: "Elevated",
  },
  HIGH: {
    title: "High Risk",
    range: "50–74",
    accent: "border-orange-500/25",
    dot: "bg-orange-500",
    badge: "border-orange-500/20 bg-orange-500/10 text-orange-300",
    guidance: "Mule Conduit",
  },
  CRITICAL: {
    title: "Critical",
    range: "≥ 75",
    accent: "border-red-500/25",
    dot: "bg-red-500",
    badge: "border-red-500/20 bg-red-500/10 text-red-300",
    guidance: "Freeze Recommended",
  },
};

function transferPolicy(level: Level) {
  if (level === "CRITICAL") return "Freeze recommended";
  if (level === "HIGH") return "Transfer up to ₹5,000";
  if (level === "MEDIUM") return "Transfer up to ₹10,000";
  return "Transfers allowed";
}

export default function ClassificationPage() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [draggedAccount, setDraggedAccount] = useState<AccountSummary | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadAccounts = () => {
    setLoading(true);
    fetchAccounts({ limit: 500, sort_by: "final_score", sort_order: "desc" })
      .then((result) => setAccounts(result.accounts))
      .catch(() => setError("Upload a CSV from the Dashboard to classify accounts."))
      .finally(() => setLoading(false));
  };

  useEffect(() => loadAccounts(), []);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? accounts.filter((account) => account.account_id.toLowerCase().includes(query))
      : accounts;
  }, [accounts, search]);

  const grouped = levels.map((level) => ({
    level,
    accounts: filteredAccounts.filter((account) => account.classification === level),
  }));
  const overriddenCount = accounts.filter((account) => account.classification_source === "manual").length;

  const updateClassification = async (account: AccountSummary, classification: Level) => {
    if (classification === account.classification) return;
    setSaving(account.account_id);
    setError("");
    try {
      const updated = await overrideAccountClassification(account.account_id, classification);
      setAccounts((current) => current.map((item) => item.account_id === updated.account_id ? updated : item));
    } catch {
      setError(`Could not update ${account.account_id}.`);
    } finally {
      setSaving(null);
    }
  };

  const handleDrop = (level: Level) => {
    if (draggedAccount) {
      void updateClassification(draggedAccount, level);
      setDraggedAccount(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-blue-400" />
              <h1 className="text-xl font-bold tracking-wide text-white">Account Risk Classification</h1>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Categorize account numbers by risk score tiers • Drag-and-drop or shift accounts to override categories
            </p>
          </div>
          <button onClick={loadAccounts} className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#101c2c] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800">
            <RefreshCw size={13} /> Refresh Board
          </button>
        </header>

        <div className="flex flex-wrap gap-2">
          <Link href="/accounts" className="rounded-lg border border-slate-800 bg-[#0b1621] px-4 py-2 text-xs text-slate-400 hover:text-white">
            ▣ Registry (Table View)
          </Link>
          <span className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
            🏷 Classification Board (Shift & Override)
          </span>
        </div>

        {error && <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-xs text-orange-200">{error}</div>}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {grouped.map(({ level, accounts: categoryAccounts }) => {
            const config = levelConfig[level];
            return (
              <div key={level} className={`rounded-xl border bg-[#0a1520] p-4 ${config.accent}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">{config.title} ({config.range})</span>
                  <span className="text-[10px] text-slate-500">{accounts.length ? Math.round((categoryAccounts.length / accounts.length) * 100) : 0}%</span>
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{categoryAccounts.length}</span>
                  <span className={`mb-1 text-[10px] font-semibold ${config.badge.split(" ").pop()}`}>{config.guidance}</span>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-slate-800 bg-[#0a1520] p-4">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
              <span>Manual Shifts</span>
              <span className="rounded bg-blue-500/10 px-2 py-1 text-[10px] text-blue-300">{overriddenCount} overridden</span>
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-lg border border-slate-700 bg-[#101b2c] px-2.5 py-2">
              <Search size={13} className="text-slate-500" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter account #..." className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500" />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0b1621] py-16 text-xs text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading classifications...</div>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-[#0b1621] py-16 text-center text-xs text-slate-500">No analyzed accounts are available. <Link className="text-blue-400 hover:underline" href="/dashboard">Upload a CSV</Link>.</div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-4">
            {grouped.map(({ level, accounts: categoryAccounts }) => {
              const config = levelConfig[level];
              return (
                <section
                  key={level}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(level)}
                  className={`min-w-0 overflow-hidden rounded-xl border bg-[#0b1621] ${config.accent}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                      <div><h2 className="text-sm font-bold text-white">{config.title}</h2><p className="text-[10px] text-slate-500">Score ({config.range})</p></div>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${config.badge}`}>{categoryAccounts.length}</span>
                  </div>
                  <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
                    {categoryAccounts.length === 0 ? <p className="py-8 text-center text-xs text-slate-600">No accounts</p> : categoryAccounts.map((account) => (
                      <article
                        key={account.account_id}
                        draggable
                        onDragStart={() => setDraggedAccount(account)}
                        onDragEnd={() => setDraggedAccount(null)}
                        className="cursor-grab rounded-lg border border-slate-800 bg-[#071019] p-3 active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/accounts/${encodeURIComponent(account.account_id)}`} className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] font-bold text-slate-200 hover:text-blue-300">
                            <GripVertical size={12} className="shrink-0 text-slate-600" /> <span className="truncate">{account.account_id}</span>
                          </Link>
                          <span className={`shrink-0 rounded border px-1.5 py-1 text-[10px] font-bold ${config.badge}`}>{account.final_score.toFixed(1)} pts</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 rounded bg-[#142235] px-2 py-1 text-[10px] text-slate-400"><Users size={11} /> {account.is_gst_registered ? "GST Merchant" : "Individual"}</div>
                        <div className="mt-3 flex justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-500">
                          <span>Drain: <b className="text-slate-300">{(account.forwarding_ratio * 100).toFixed(0)}%</b></span>
                          <span>Hold: <b className="text-slate-300">{account.median_holding_time_hours.toFixed(2)}h</b></span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                          <span>{transferPolicy(level)}</span>
                          <label className="flex items-center gap-1.5 rounded border border-slate-700 bg-[#101b2c] px-2 py-1.5 text-slate-300">
                            <SlidersHorizontal size={11} />
                            <select value={level} disabled={saving === account.account_id} onChange={(event) => updateClassification(account, event.target.value as Level)} className="bg-transparent text-[10px] outline-none">
                              {levels.map((option) => <option key={option}>{option}</option>)}
                            </select>
                          </label>
                        </div>
                        {account.classification_source === "manual" && <div className="mt-2 flex items-center gap-1 text-[9px] text-emerald-400"><Check size={11} /> Manual override stored</div>}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg border border-slate-800 bg-[#0b1621] px-4 py-3 text-[11px] text-slate-400">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-red-400" />
          <span><b className="text-slate-200">Transfer controls are advisory:</b> Low-risk transfers are allowed; Medium and High tiers show recommended rupee limits; Critical accounts are recommended for review and freeze. FinGuard does not automatically freeze accounts.</span>
        </div>
      </div>
    </AppShell>
  );
}
