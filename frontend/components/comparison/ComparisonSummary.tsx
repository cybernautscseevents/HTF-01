import {
  Network,
  Users,
  GitCompareArrows,
  AlertTriangle,
} from "lucide-react";

const stats = [
  {
    label: "Cases Compared",
    value: "3",
    icon: GitCompareArrows,
  },
  {
    label: "Accounts Analyzed",
    value: "30",
    icon: Users,
  },
  {
    label: "Common Accounts",
    value: "4",
    icon: Network,
  },
  {
    label: "Shared High-Risk Accounts",
    value: "2",
    icon: AlertTriangle,
  },
];

export default function ComparisonSummary() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="rounded-lg border border-slate-800 bg-[#0b1621] p-4"
          >
            <div className="flex items-start justify-between">

              <div>
                <p className="text-[9px] text-slate-600">
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