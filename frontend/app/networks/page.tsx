import {
  Activity,
  AlertTriangle,
  Network,
  Search,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import PatternHeader from "@/components/patterns/PatternHeader";
import EvidenceList from "@/components/patterns/EvidenceList";
import NetworkCharacteristics from "@/components/patterns/NetworkCharacteristics";
import InvestigationRecommendations from "@/components/patterns/InvestigationRecommendations";

export default function NetworksPage() {
  return (
    <AppShell>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Network Pattern Analysis
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Understand why this network was flagged
            </p>
          </div>

          <div className="flex gap-2">

            <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-[#0b1621] px-3 py-2 text-[10px] text-slate-400">
              <Search size={12} />

              <span>Case:</span>

              <span className="text-slate-200">
                CAS-2026-001
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-[#0b1621] px-3 py-2 text-[10px] text-slate-400">
              <Network size={12} />

              Network N-001
            </div>

          </div>

        </div>

        {/* Pattern */}
        <PatternHeader />

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          <EvidenceList />

          <NetworkCharacteristics />

        </div>

        {/* Recommendations */}
        <InvestigationRecommendations />

        {/* Bottom stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <MiniStat
            icon={Activity}
            label="Pattern Frequency"
            value="4 similar networks"
          />

          <MiniStat
            icon={AlertTriangle}
            label="Risk Level"
            value="High"
          />

          <MiniStat
            icon={Network}
            label="Network Status"
            value="Under Investigation"
          />

        </div>

      </div>
    </AppShell>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
        <Icon size={15} />
      </div>

      <div>
        <p className="text-[9px] text-slate-600">
          {label}
        </p>

        <p className="mt-1 text-xs font-medium text-slate-300">
          {value}
        </p>
      </div>

    </div>
  );
}