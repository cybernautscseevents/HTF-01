import {
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export default function AccountHeader({
  accountId,
}: {
  accountId: string;
}) {
  return (
    <div className="space-y-4">

      <Link
        href="/accounts"
        className="inline-flex items-center gap-2 text-[10px] text-slate-500 transition hover:text-slate-300"
      >
        <ArrowLeft size={13} />
        Back to Accounts
      </Link>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
            <ShieldAlert
              size={20}
              className="text-red-400"
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">
                {accountId}
              </h2>

              <span className="rounded bg-red-500/15 px-2 py-1 text-[9px] font-medium text-red-400">
                High Risk
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Aggregator • Possible Mule Account
            </p>
          </div>

        </div>

        <div className="flex gap-2">

          <button className="rounded-md border border-slate-700 bg-[#0b1621] px-3 py-2 text-[10px] text-slate-300 hover:bg-slate-800">
            Add to Case
          </button>

          <button className="rounded-md bg-blue-600 px-3 py-2 text-[10px] font-medium text-white hover:bg-blue-500">
            Investigate Network
          </button>

        </div>

      </div>
    </div>
  );
}