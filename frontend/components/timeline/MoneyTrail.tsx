"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { MoneyTrailData, TrailHop, fetchMoneyTrail } from "@/lib/api";

interface MoneyTrailProps {
  seedId?: string;
  trailData?: MoneyTrailData | null;
}

export default function MoneyTrail({ seedId = "MULE_RAPID_047", trailData: externalTrail }: MoneyTrailProps) {
  const [data, setData] = useState<MoneyTrailData | null>(externalTrail || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (externalTrail) {
      setData(externalTrail);
      return;
    }
    if (seedId) {
      setLoading(true);
      fetchMoneyTrail(seedId)
        .then((res) => setData(res))
        .catch((err) => console.error("Error loading money trail:", err))
        .finally(() => setLoading(false));
    }
  }, [seedId, externalTrail]);

  const trailHops = data?.trail || [];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#071019] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <CircleDollarSign size={20} className="text-blue-400" />
          <div>
            <h2 className="text-base font-semibold text-white">
              Downstream Money Trail Propagation
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Chronological hop-by-hop tracking of fund dissipation and intermediary mules
            </p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded bg-slate-800 px-2.5 py-1 font-mono text-slate-300">
              Total Hops: {data.total_hops}
            </span>
            <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 font-mono font-bold text-blue-400">
              Initial Amount: ₹{data.origin_amount?.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="p-8 text-center text-xs text-slate-400">
          Tracing downstream fund movements...
        </div>
      )}

      {!loading && trailHops.length === 0 && (
        <div className="p-8 text-center text-xs text-slate-500">
          No downstream forwarding trail found for this transaction/account.
        </div>
      )}

      {/* Visual Flow Pipeline */}
      {!loading && trailHops.length > 0 && (
        <div className="border-b border-slate-800 p-5">
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-max items-center justify-start gap-3 py-3">
              {trailHops.map((hop, index) => {
                const isOrigin = hop.hop === 0;
                const isCrit = hop.receiver_classification === "CRITICAL";
                return (
                  <div key={hop.transaction_id + index} className="flex items-center">
                    <div
                      className={`min-w-[140px] rounded-xl border p-3 text-center transition shadow-lg ${
                        isOrigin
                          ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                          : isCrit
                          ? "border-red-500/60 bg-red-500/10 text-red-300"
                          : "border-orange-500/60 bg-orange-500/10 text-orange-300"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {isOrigin ? "Origin Source" : `Hop #${hop.hop}`}
                      </div>
                      <div className="mt-1 font-mono text-sm font-bold text-white">
                        {hop.receiver_id}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-emerald-400">
                        ₹{hop.amount.toLocaleString()}
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
                        <Clock size={10} />
                        <span>
                          {hop.holding_time_seconds > 0
                            ? `${hop.holding_time_seconds}s hold`
                            : "Direct"}
                        </span>
                      </div>
                      <div className="mt-1 text-[9px] font-bold uppercase">
                        {hop.receiver_classification} ({hop.receiver_risk_score} pts)
                      </div>
                    </div>

                    {index < trailHops.length - 1 && (
                      <div className="flex flex-col items-center mx-2 text-slate-500">
                        <ArrowRight size={20} className="text-slate-500" />
                        <span className="text-[9px] font-mono text-slate-400">
                          {hop.channel}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Details Table */}
      {!loading && trailHops.length > 0 && (
        <div className="p-5">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Reconstructed Evidence Trail
            </h3>
            <p className="text-xs text-slate-500">
              Sequential transaction records verifying the chain of custody
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-2.5 font-medium">Hop</th>
                  <th className="px-3 py-2.5 font-medium">Timestamp</th>
                  <th className="px-3 py-2.5 font-medium">Sender</th>
                  <th className="px-3 py-2.5 font-medium">Receiver</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Holding Time</th>
                  <th className="px-3 py-2.5 font-medium">Receiver Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {trailHops.map((hop) => (
                  <tr key={hop.transaction_id} className="hover:bg-slate-900/50">
                    <td className="px-3 py-2.5 font-mono text-slate-400">#{hop.hop}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-400">
                      {new Date(hop.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-medium text-slate-200">
                      {hop.sender_id}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-white">
                      {hop.receiver_id}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-emerald-400">
                      ₹{hop.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      {hop.holding_time_seconds > 0 ? `${hop.holding_time_seconds} seconds` : "Immediate"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          hop.receiver_classification === "CRITICAL"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                        }`}
                      >
                        {hop.receiver_risk_score} pts ({hop.receiver_classification})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}