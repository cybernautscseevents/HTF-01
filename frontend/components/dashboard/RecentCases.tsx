"use client";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { NetworkCase } from "@/lib/api";

interface RecentCasesProps {
  cases: NetworkCase[];
  loading: boolean;
}

export default function RecentCases({ cases, loading }: RecentCasesProps) {

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            High-Risk Entities & Network Cases
          </h3>
          <p className="text-[11px] text-slate-500">
            Highest priority transaction networks flagged for immediate investigation
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
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
            <LoaderCircle size={15} className="animate-spin text-blue-400" />
            Waiting for backend network analysis...
          </div>
        ) : cases.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No suspicious cases detected in current dataset.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-500 text-[11px]">
              <tr>
                <th className="pb-2.5">Case ID</th>
                <th className="pb-2.5">Reported Date</th>
                <th className="pb-2.5">Amount</th>
                <th className="pb-2.5">Detected Network</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {cases.map((item) => (
                <tr key={item.network_id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 font-mono font-medium text-slate-200">
                    {item.case_id}
                  </td>
                  <td className="py-2.5 text-slate-300">{item.reported_date}</td>
                  <td className="py-2.5 font-mono text-slate-300">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 font-mono text-slate-300">
                    {item.network_id} ({item.people_involved} people)
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        item.status === "Critical"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : item.status === "High"
                          ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="py-2.5 text-right">
                    <Link
                      href="/investigate"
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