import {
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const accounts = [
  {
    id: "BX7821",
    cases: ["CAS-2026-001", "CAS-2026-007", "CAS-2026-012"],
    score: 94,
    role: "Relay",
    appearances: 3,
  },
  {
    id: "AX9341",
    cases: ["CAS-2026-001", "CAS-2026-007"],
    score: 91,
    role: "Aggregator",
    appearances: 2,
  },
  {
    id: "CX1102",
    cases: ["CAS-2026-001", "CAS-2026-012"],
    score: 92,
    role: "Mule",
    appearances: 2,
  },
  {
    id: "FX4421",
    cases: ["CAS-2026-007", "CAS-2026-012"],
    score: 86,
    role: "Mule",
    appearances: 2,
  },
];

export default function CommonAccounts() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Common Accounts
        </h3>

        <p className="mt-1 text-[10px] text-slate-500">
          Accounts appearing across multiple suspicious networks
        </p>
      </div>

      <div className="space-y-2">

        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-col gap-3 rounded-md border border-slate-800 bg-[#071019] p-3 lg:flex-row lg:items-center"
          >

            {/* Account */}
            <div className="flex min-w-[140px] items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-[10px] font-semibold text-red-400">
                {account.id.slice(0, 2)}
              </div>

              <div>
                <p className="text-xs font-medium text-slate-300">
                  {account.id}
                </p>

                <p className="text-[9px] text-slate-600">
                  {account.role}
                </p>
              </div>

            </div>

            {/* Cases */}
            <div className="flex flex-1 flex-wrap gap-1">

              {account.cases.map((caseId) => (
                <span
                  key={caseId}
                  className="rounded bg-slate-800 px-2 py-1 text-[9px] text-slate-400"
                >
                  {caseId}
                </span>
              ))}

            </div>

            {/* Score */}
            <div className="flex items-center gap-4">

              <div className="text-right">
                <p className="text-[9px] text-slate-600">
                  Risk
                </p>

                <p className="text-xs font-semibold text-red-400">
                  {account.score}/100
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] text-slate-600">
                  Appearances
                </p>

                <p className="text-xs text-slate-300">
                  {account.appearances}
                </p>
              </div>

              <Link
                href={`/accounts/${account.id}`}
                className="text-slate-600 hover:text-blue-400"
              >
                <ExternalLink size={14} />
              </Link>

            </div>

          </div>
        ))}

      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md border border-red-500/20 bg-red-500/5 p-3">

        <AlertTriangle
          size={14}
          className="mt-0.5 shrink-0 text-red-400"
        />

        <p className="text-[9px] leading-4 text-slate-500">
          Repeated appearance does not independently establish
          fraudulent activity. Analysts should validate ownership,
          transaction context, and other evidence.
        </p>

      </div>

    </div>
  );
}