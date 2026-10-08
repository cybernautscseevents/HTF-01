import { IndianRupee, Network, Users, AlertTriangle } from "lucide-react";

const metrics = [
  {
    label: "Network Risk",
    value: "91 / 100",
    icon: AlertTriangle,
  },
  {
    label: "Accounts",
    value: "10",
    icon: Users,
  },
  {
    label: "Transactions",
    value: "29",
    icon: Network,
  },
  {
    label: "Total Value",
    value: "₹20,000",
    icon: IndianRupee,
  },
];

export default function ReportSummary() {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-400">
        Investigation Summary
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  {metric.label}
                </span>

                <Icon size={18} className="text-slate-500" />
              </div>

              <p className="text-2xl font-semibold text-white">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}