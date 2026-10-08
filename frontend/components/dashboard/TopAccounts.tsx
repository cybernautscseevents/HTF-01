"use client";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { NetworkCase } from "@/lib/api";

interface TopAccountsProps {
  cases: NetworkCase[];
  loading: boolean;
}

export default function TopAccounts({ cases, loading }: TopAccountsProps) {

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Top Suspicious Networks
        </h3>
        <Link
          href="/investigate"
          className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition"
        >
          View Full Network →
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
          <LoaderCircle size={15} className="animate-spin text-blue-400" />
          Waiting for backend network analysis...
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 text-slate-500 text-[11px]">
            <tr>
              <th className="pb-2">Network ID</th>
              <th className="pb-2">Risk Score</th>
              <th className="pb-2">Role</th>
              <th className="pb-2 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {cases.slice(0, 5).map((network) => (
              <tr key={network.network_id} className="hover:bg-slate-900/40">
                <td className="py-2.5 font-mono font-medium text-slate-200">
                  {network.network_id}
                </td>

                <td className="py-2.5 font-mono font-bold text-red-400">
                  {network.risk_score.toFixed(1)} / 100
                </td>

                <td className="py-2.5">
                  <span className="text-slate-300">{network.role}</span>
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