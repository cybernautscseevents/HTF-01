import {
  Filter,
  Network,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import NetworkGraph from "@/components/investigation/NetworkGraph";
import AccountPanel from "@/components/investigation/AccountPanel";
import FlowReplay from "@/components/investigation/FlowReplay";

export default function InvestigatePage() {
  return (
    <AppShell>
      <div className="space-y-4">

        {/* Page title */}
        <div>
          <h2 className="text-lg font-semibold text-white">
            Network Investigation
          </h2>

          <p className="text-xs text-slate-500">
            Explore the money trail and connections
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col justify-between gap-3 lg:flex-row">

          <div className="flex gap-2">
            <input
              defaultValue="CAS-2026-001"
              className="w-56 rounded-md border border-slate-700 bg-[#0b1621] px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
            />

            <button className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-500">
              Load Network
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-[#0b1621] px-3 text-xs text-slate-400">
              <Network size={13} />

              <span>Layout:</span>

              <select className="bg-transparent text-slate-200 outline-none">
                <option>Hierarchical</option>
              </select>
            </div>

            <button className="flex items-center gap-2 rounded-md border border-slate-700 bg-[#0b1621] px-3 py-2 text-xs text-slate-300 hover:bg-slate-800">
              <Filter size={13} />
              Filters
            </button>
          </div>
        </div>

        {/* Investigation workspace */}
        <div className="overflow-hidden rounded-lg border border-slate-800">

          <div className="grid min-h-[520px] grid-cols-1 xl:grid-cols-[1fr_250px]">

            <NetworkGraph />

            <AccountPanel />

          </div>

          <FlowReplay />

        </div>
      </div>
    </AppShell>
  );
}