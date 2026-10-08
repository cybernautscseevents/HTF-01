import {
  ArrowRight,
  CircleAlert,
  Search,
} from "lucide-react";

const recommendations = [
  {
    priority: "High",
    title: "Review Account A",
    description:
      "Verify why the account received funds from a large number of unrelated senders.",
  },
  {
    priority: "High",
    title: "Trace Relay Account B",
    description:
      "Investigate the next-hop account because it receives aggregated funds and distributes them downstream.",
  },
  {
    priority: "Medium",
    title: "Examine C, D and E",
    description:
      "Review downstream accounts for common ownership, device links, or repeated transaction behavior.",
  },
];

export default function InvestigationRecommendations() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="mb-4 flex items-center gap-2">
        <Search size={15} className="text-blue-400" />

        <div>
          <h3 className="text-sm font-semibold text-white">
            Recommended Investigation
          </h3>

          <p className="mt-1 text-[10px] text-slate-500">
            Suggested next steps based on the observed network
          </p>
        </div>
      </div>

      <div className="space-y-3">

        {recommendations.map((item, index) => (
          <div
            key={item.title}
            className="flex gap-3 rounded-md border border-slate-800 bg-[#071019] p-3"
          >

            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-semibold text-blue-400">
              {index + 1}
            </div>

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-slate-300">
                  {item.title}
                </p>

                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] ${
                    item.priority === "High"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {item.priority}
                </span>
              </div>

              <p className="mt-1 text-[10px] leading-4 text-slate-600">
                {item.description}
              </p>

            </div>

            <ArrowRight
              size={13}
              className="mt-1 shrink-0 text-slate-700"
            />

          </div>
        ))}

      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">

        <CircleAlert
          size={14}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <p className="text-[9px] leading-4 text-slate-500">
          These recommendations are investigative suggestions,
          not definitive fraud determinations. Analysts should
          validate the underlying transaction evidence.
        </p>

      </div>

    </div>
  );
}