"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ShieldAlert, User } from "lucide-react";
import { AccountSummary, fetchAccounts } from "@/lib/api";

export default function RecentCases() {
  const [cases, setCases] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts({ limit: 6, sort_by: "final_score", sort_order: "desc" })
      .then((res) => setCases(res.accounts))
      .catch((err) => console.error("Error loading recent cases:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            High-Risk Entities & Network Cases
          </h3>
          <p className="text-[11px] text-slate-500">
            Highest priority accounts flagged for immediate investigation
          </p>
        </div>

        <Link
          href="/accounts"
          className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition"
        >
          View All Accounts →
        </Link>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Loading flagged entities...
          </div>
        ) : cases.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No suspicious cases detected in current dataset.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-500 text-[11px]">
              <tr>
                <th className="pb-2.5">Entity / Account</th>
                <th className="pb-2.5">Tax Status</th>
                <th className="pb-2.5">Drain Ratio</th>
                <th className="pb-2.5">Risk Score</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {cases.map((item) => (
                <tr key={item.account_id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-mono font-medium text-slate-200">
                    {item.account_id}
                  </td>

                  <td className="py-2.5">
                    {item.is_gst_registered ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <Building2 size={12} /> GST Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <User size={12} /> Individual
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 font-mono text-slate-300">
                    {(item.forwarding_ratio * 100).toFixed(0)}%
                  </td>

                  <td className="py-2.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        item.classification === "CRITICAL"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : item.classification === "HIGH"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {item.final_score.toFixed(1)} ({item.classification})
                    </span>
                  </td>

                  <td className="py-2.5 text-right">
                    <Link
                      href={`/accounts/${item.account_id}`}
                      className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}