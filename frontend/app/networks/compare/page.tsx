import {
  ArrowLeft,
  GitCompareArrows,
} from "lucide-react";
import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import CaseSelector from "@/components/comparison/CaseSelector";
import ComparisonSummary from "@/components/comparison/ComparisonSummary";
import CommonAccounts from "@/components/comparison/CommonAccounts";
import NetworkComparisonTable from "@/components/comparison/NetworkComparisonTable";

export default function NetworkComparisonPage() {
  return (
    <AppShell>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">

          <div>

            <Link
              href="/networks"
              className="mb-3 inline-flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300"
            >
              <ArrowLeft size={12} />
              Network Analysis
            </Link>

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <GitCompareArrows size={17} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Network Comparison
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Identify common accounts and similar fraud patterns
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Case selection */}
        <CaseSelector />

        {/* Summary */}
        <ComparisonSummary />

        {/* Common accounts */}
        <CommonAccounts />

        {/* Comparison */}
        <NetworkComparisonTable />

      </div>
    </AppShell>
  );
}