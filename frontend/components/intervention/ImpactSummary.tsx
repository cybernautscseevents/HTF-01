import {
  CircleDollarSign,
  GitBranch,
  Network,
  WalletCards,
} from "lucide-react";

const metrics = [
  {
    label: "Potentially Affected Funds",
    value: "₹18,400",
    icon: CircleDollarSign,
  },
  {
    label: "Downstream Accounts",
    value: "3",
    icon: GitBranch,
  },
  {
    label: "Interrupted Hops",
    value: "3",
    icon: Network,
  },
  {
    label: "Transactions",
    value: "4",
    icon: WalletCards,
  },
];

export default function ImpactSummary() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

      {metrics.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-lg border border-slate-800 bg-[#0b1621] p-4"
          >

            <div className="flex items-start justify-between">

              <div>
                <p className="max-w-[120px] text-[9px] leading-4 text-slate-600">
                  {item.label}
                </p>

                <p className="mt-2 text-xl font-semibold text-white">
                  {item.value}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-400">
                <Icon size={15} />
              </div>

            </div>

          </div>
        );
      })}

    </div>
  );
}