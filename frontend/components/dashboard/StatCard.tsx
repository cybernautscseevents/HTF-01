import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive?: boolean;
  icon: LucideIcon;
}

export default function StatCard({
  title,
  value,
  change,
  positive = true,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-slate-500">{title}</p>

          <p className="mt-2 text-2xl font-semibold text-white">
            {value}
          </p>

          <p
            className={`mt-1 text-[10px] ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            ↑ {change}
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}