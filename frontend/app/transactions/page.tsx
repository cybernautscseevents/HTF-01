import AppShell from "@/components/layout/AppShell";
import MoneyTrail from "@/components/timeline/MoneyTrail";

export default function TransactionsPage() {
  return (
    <AppShell>
      <div className="space-y-4">

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Money Trail Timeline
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Step-by-step transaction flow with timestamps
            </p>
          </div>

          <div className="rounded-md border border-slate-800 bg-[#0b1621] px-3 py-2 text-[10px] text-slate-400">
            Case:{" "}
            <span className="text-slate-200">
              CAS-2026-001
            </span>
          </div>
        </div>

        <MoneyTrail />

      </div>
    </AppShell>
  );
}