"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountSummary, fetchAccounts } from "@/lib/api";

export default function TopAccounts() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts({ limit: 6, sort_by: "final_score", sort_order: "desc" })
      .then((res) => setAccounts(res.accounts))
      .catch((err) => console.error("Error loading top accounts:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Top Suspected Mule Accounts
        </h3>
        <Link
          href="/investigate"
          className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition"
        >
          View Full Network →
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Loading accounts...
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 text-slate-500 text-[11px]">
            <tr>
              <th className="pb-2">Account ID</th>
              <th className="pb-2">Risk Score</th>
              <th className="pb-2">Classification</th>
              <th className="pb-2 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {accounts.map((account) => (
              <tr key={account.account_id} className="hover:bg-slate-900/40">
                <td className="py-2.5 font-mono font-medium text-slate-200">
                  {account.account_id}
                </td>

                <td className="py-2.5 font-mono font-bold text-red-400">
                  {account.final_score.toFixed(1)} / 100
                </td>

                <td className="py-2.5">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      account.classification === "CRITICAL"
                        ? "bg-red-500/10 text-red-400 border border-red-500/30"
                        : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                    }`}
                  >
                    {account.classification}
                  </span>
                </td>

                <td className="py-2.5 text-right">
                  <Link
                    href="/investigate"
                    className="text-[11px] font-medium text-blue-400 hover:underline"
                  >
                    Investigate
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}