import {
  ArrowUpRight,
  Clock3,
  GitBranch,
  Users,
} from "lucide-react";

const evidence = [
  {
    icon: Users,
    value: "20",
    label: "Unique incoming accounts",
    description:
      "Funds were received from many distinct accounts.",
  },
  {
    icon: ArrowUpRight,
    value: "92%",
    label: "Forwarding ratio",
    description:
      "Most received funds were rapidly forwarded.",
  },
  {
    icon: Clock3,
    value: "47 sec",
    label: "Median hold time",
    description:
      "Funds remained in the account for a very short period.",
  },
  {
    icon: GitBranch,
    value: "3",
    label: "Downstream mule accounts",
    description:
      "The relay account connects to multiple suspicious recipients.",
  },
];

export default function EvidenceList() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Evidence
        </h3>

        <p className="mt-1 text-[10px] text-slate-500">
          Observable behaviors supporting the detected pattern
        </p>
      </div>

      <div className="space-y-3">

        {evidence.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex gap-3 rounded-md border border-slate-800 bg-[#071019] p-3"
            >

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-red-400">
                <Icon size={15} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-300">
                    {item.label}
                  </p>

                  <span className="text-sm font-semibold text-red-400">
                    {item.value}
                  </span>
                </div>

                <p className="mt-1 text-[10px] leading-4 text-slate-600">
                  {item.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
}