import { BrainCircuit, ShieldAlert } from "lucide-react";

export default function PatternHeader() {
  return (
    <div className="rounded-lg border border-red-500/20 bg-[#0b1621] p-5">

      <div className="flex flex-col justify-between gap-5 md:flex-row">

        <div className="flex gap-4">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
            <ShieldAlert
              size={21}
              className="text-red-400"
            />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Detected Pattern
            </p>

            <h3 className="mt-2 text-xl font-semibold text-white">
              Aggregation
              <span className="mx-2 text-slate-600">
                →
              </span>
              Relay
              <span className="mx-2 text-slate-600">
                →
              </span>
              Distribution
            </h3>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
              Multiple independent incoming transactions converge
              on a single account, which rapidly forwards funds to
              another intermediary before the funds are distributed
              across downstream accounts.
            </p>
          </div>

        </div>

        {/* Confidence */}
        <div className="flex min-w-[150px] flex-col items-start md:items-end">

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <BrainCircuit size={13} />
            Pattern Confidence
          </div>

          <div className="mt-2 text-3xl font-semibold text-red-400">
            87%
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800 md:w-36">
            <div className="h-full w-[87%] rounded-full bg-red-500" />
          </div>

        </div>

      </div>
    </div>
  );
}