"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  CircleDollarSign,
  LoaderCircle,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MoneyTrailData, fetchMoneyTrail } from "@/lib/api";

interface MoneyTrailProps {
  trailData?: MoneyTrailData | null;
}

type NodeRole = "Victim" | "Aggregator" | "Relay" | "Mule" | "Cash-out";

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function roleFor(index: number, total: number): NodeRole {
  if (index === 0) return "Victim";
  if (index === 1) return "Aggregator";
  if (index === 2 && total > 4) return "Relay";
  if (index === total - 1) return "Cash-out";
  return "Mule";
}

function nodeTone(role: NodeRole) {
  if (role === "Victim") return "border-sky-400 bg-sky-500 text-sky-100";
  if (role === "Aggregator") return "border-red-400 bg-red-500 text-white";
  if (role === "Relay") return "border-orange-400 bg-orange-500 text-white";
  if (role === "Mule") return "border-amber-300 bg-amber-500 text-white";
  return "border-violet-400 bg-violet-600 text-white";
}

export default function MoneyTrail({ trailData: externalTrail }: MoneyTrailProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [data, setData] = useState<MoneyTrailData | null>(externalTrail || null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const result = await fetchMoneyTrail(trimmed);
      setData(result);
      setSelectedAccount(result.ordered_accounts?.[1] || "");
    } catch {
      setData(null);
      setError(`No transaction network found for "${trimmed}".`);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void search(query);
  };

  const trail = data?.trail || [];
  const accounts = data?.ordered_accounts || [];
  const selectedIndex = Math.max(0, accounts.indexOf(selectedAccount));
  const selectedRole = roleFor(selectedIndex, accounts.length);

  const selectedTransactions = useMemo(
    () => trail.filter((item) => item.sender_id === selectedAccount || item.receiver_id === selectedAccount),
    [selectedAccount, trail],
  );
  const incoming = selectedTransactions.filter((item) => item.receiver_id === selectedAccount);
  const outgoing = selectedTransactions.filter((item) => item.sender_id === selectedAccount);
  const received = incoming.reduce((sum, item) => sum + item.amount, 0);
  const forwarded = outgoing.reduce((sum, item) => sum + item.amount, 0);
  const risk = trail.find((item) => item.receiver_id === selectedAccount)?.receiver_risk_score || 0;
  const classification = trail.find((item) => item.receiver_id === selectedAccount)?.receiver_classification || "LOW";

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#050d16] shadow-2xl">
      <header className="border-b border-slate-800 px-5 py-4">
        <div>
          <div>
            <h2 className="text-lg font-semibold text-white">Network Investigation</h2>
            <p className="text-xs text-slate-400">Explore the money trail and connections</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Case ID or transaction ID"
              className="w-full rounded-md border border-slate-700 bg-[#0b1621] py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <LoaderCircle size={15} className="animate-spin" /> : "Load Network"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </header>

      {!data && !loading && (
        <div className="p-12 text-center text-xs text-slate-500">
          Enter a case ID or transaction ID to load the transaction network.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 p-12 text-xs text-slate-400">
          <LoaderCircle size={16} className="animate-spin text-blue-400" />
          Loading stored network...
        </div>
      )}

      {data && !loading && (
        <div className="grid min-h-[510px] lg:grid-cols-[minmax(0,1fr)_285px]">
          <div className="relative border-r border-slate-800 bg-[radial-gradient(circle_at_50%_45%,rgba(21,57,78,.22),transparent_55%)] p-4">
            <div className="absolute left-4 top-4 z-10 space-y-2 rounded-lg bg-slate-950/80 p-2 text-[10px] text-slate-300">
              {[
                ["bg-sky-500", "Victim"],
                ["bg-cyan-400", "Normal Account"],
                ["bg-red-500", "Suspicious Account"],
                ["bg-amber-500", "Mule Account"],
                ["bg-violet-500", "Cash-out / Exit"],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${color}`} /> {label}
                </div>
              ))}
              <div className="mt-1 flex items-center gap-2 border-t border-slate-800 pt-1">
                <ArrowRight size={14} /> Money Flow
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <ArrowRight size={14} /> Suspicious Flow
              </div>
            </div>

            <div className="flex min-h-[465px] items-center justify-center overflow-x-auto pt-16">
              <div className="flex min-w-max items-center gap-2">
                {accounts.map((account, index) => {
                  const role = roleFor(index, accounts.length);
                  const accountIncoming = trail.filter((item) => item.receiver_id === account);
                  const accountOutgoing = trail.filter((item) => item.sender_id === account);
                  const suspicious = accountOutgoing.some((item) => item.receiver_classification === "HIGH" || item.receiver_classification === "CRITICAL");
                  return (
                    <div key={account} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedAccount(account)}
                        className={`group flex w-[72px] flex-col items-center rounded-lg p-1 transition hover:bg-white/5 ${
                          selectedAccount === account ? "ring-1 ring-blue-400" : ""
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold shadow-lg ${nodeTone(role)}`}>
                          {role === "Cash-out" ? "F" : account.slice(-1)}
                        </span>
                        <span className="mt-1 max-w-[72px] truncate text-xs font-semibold text-white">{account}</span>
                        <span className="text-[10px] text-slate-400">({role})</span>
                        {(accountIncoming.length || accountOutgoing.length) > 0 && (
                          <span className="mt-1 text-[9px] text-slate-500">
                            {accountIncoming.length + accountOutgoing.length} txns
                          </span>
                        )}
                      </button>
                      {index < accounts.length - 1 && (
                        <div className={`relative mx-1 flex w-12 items-center ${suspicious ? "text-red-400" : "text-slate-400"}`}>
                          <div className={`h-px w-full ${suspicious ? "bg-red-500" : "bg-slate-500"}`} />
                          <ArrowRight size={14} className="absolute right-0" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute bottom-4 left-4 flex gap-1">
              <button type="button" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">+</button>
              <button type="button" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">−</button>
              <button type="button" className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300">⌘</button>
            </div>
          </div>

          <aside className="bg-[#091521] p-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-semibold text-white">{selectedAccount || "Select an account"}</h3>
                <p className="mt-1 text-[11px] text-slate-400">Account ID {selectedAccount || "—"}</p>
              </div>
              <span className={`rounded px-2 py-1 text-[10px] font-bold ${
                classification === "CRITICAL" || classification === "HIGH"
                  ? "bg-red-500 text-white"
                  : "bg-amber-500 text-black"
              }`}>
                {classification === "LOW" ? "Normal" : `${classification} Risk`}
              </span>
            </div>

            <div className="space-y-3 py-4 text-xs">
              <div className="flex justify-between text-slate-400"><span>Risk Score</span><strong className="text-white">{Math.round(risk)} / 100</strong></div>
              <div className="h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-red-500" style={{ width: `${Math.min(100, risk)}%` }} /></div>
              <div className="flex justify-between text-slate-400"><span>Role</span><strong className="text-right text-slate-200">{selectedRole} {classification === "HIGH" ? "(Possible Mule)" : ""}</strong></div>
            </div>

            <div className="grid grid-cols-2 border-b border-slate-800 text-[11px]">
              <div className="border-b-2 border-blue-500 bg-blue-500/10 px-2 py-2 text-center text-blue-300">Key Metrics</div>
              <div className="px-2 py-2 text-center text-slate-400">Recent Transactions</div>
            </div>
            <div className="space-y-3 py-4 text-xs">
              <div className="flex justify-between text-slate-400"><span>Incoming txns</span><b className="text-slate-200">{incoming.length}</b></div>
              <div className="flex justify-between text-slate-400"><span>Outgoing txns</span><b className="text-slate-200">{outgoing.length}</b></div>
              <div className="flex justify-between text-slate-400"><span>Total received</span><b className="text-slate-200">{money(received)}</b></div>
              <div className="flex justify-between text-slate-400"><span>Total forwarded</span><b className="text-slate-200">{money(forwarded)} ({received ? Math.round((forwarded / received) * 100) : 0}%)</b></div>
              <div className="flex justify-between text-slate-400"><span>Unique senders</span><b className="text-slate-200">{new Set(incoming.map((item) => item.sender_id)).size}</b></div>
              <div className="flex justify-between text-slate-400"><span>Unique receivers</span><b className="text-slate-200">{new Set(outgoing.map((item) => item.receiver_id)).size}</b></div>
              <div className="flex justify-between text-slate-400"><span>Median hold time</span><b className="text-slate-200">{selectedTransactions.length ? Math.round(selectedTransactions.reduce((sum, item) => sum + item.holding_time_seconds, 0) / selectedTransactions.length) : 0} seconds</b></div>
            </div>
            <button
              type="button"
              disabled={!selectedAccount}
              onClick={() => router.push(`/accounts/${encodeURIComponent(selectedAccount)}`)}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              View Full Details <ArrowRight size={14} />
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
