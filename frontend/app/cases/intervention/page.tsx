import {
  ArrowLeft,
  Info,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import InterventionControls from "@/components/intervention/InterventionControls";
import ImpactSummary from "@/components/intervention/ImpactSummary";
import BeforeNetwork from "@/components/intervention/BeforeNetwork";
import AfterNetwork from "@/components/intervention/AfterNetwork";

export default function InterventionPage() {
  return (
    <AppShell>
      <div className="space-y-5">

        {/* Header */}
        <div>

          <Link
            href="/investigate"
            className="mb-3 inline-flex items-center gap-2 text-[10px] text-slate-500 hover:text-slate-300"
          >
            <ArrowLeft size={12} />
            Network Investigation
          </Link>

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck size={17} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white">
                Intervention Simulator
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Estimate the potential network impact of an intervention
              </p>
            </div>

          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">

          <Info
            size={15}
            className="mt-0.5 shrink-0 text-amber-400"
          />

          <div>
            <p className="text-xs font-medium text-amber-300">
              Simulation Environment
            </p>

            <p className="mt-1 text-[10px] leading-4 text-slate-500">
              This tool models a hypothetical intervention against
              the currently loaded transaction network. It does not
              connect to or modify any real banking account.
            </p>
          </div>

        </div>

        {/* Controls */}
        <InterventionControls />

        {/* Impact */}
        <ImpactSummary />

        {/* Before / After */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">

          <BeforeNetwork />

          <AfterNetwork />

        </div>

        {/* Explanation */}
        <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

          <h3 className="text-sm font-semibold text-white">
            Simulation Interpretation
          </h3>

          <p className="mt-2 max-w-4xl text-xs leading-5 text-slate-500">
            Freezing BX7821 in this simulated network interrupts the
            modeled downstream paths to accounts C, D, and E.
            Approximately ₹18,400 in outgoing flow is associated
            with those paths in the current dataset. This represents
            a graph-based estimate and should not be interpreted as
            a prediction of actual recoverable funds.
          </p>

        </div>

      </div>
    </AppShell>
  );
}