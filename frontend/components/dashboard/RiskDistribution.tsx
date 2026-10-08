"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { DashboardStats, fetchStats } from "@/lib/api";

interface RiskDistributionProps {
  stats?: DashboardStats | null;
}

const COLORS = [
  "#22d3a3", // Low: emerald
  "#f59e0b", // Medium: amber
  "#f97316", // High: orange
  "#ef4444", // Critical: red
];

export default function RiskDistribution({ stats: externalStats }: RiskDistributionProps) {
  const [stats, setStats] = useState<DashboardStats | null>(externalStats || null);
  const [loading, setLoading] = useState(!externalStats);

  useEffect(() => {
    if (externalStats) {
      setStats(externalStats);
      return;
    }
    fetchStats()
      .then((res) => setStats(res))
      .catch((err) => console.error("Error fetching stats for risk distribution:", err))
      .finally(() => setLoading(false));
  }, [externalStats]);

  const total = stats?.total_accounts || 1;
  const low = stats?.low_risk_accounts || 0;
  const medium = stats?.medium_risk_accounts || 0;
  const high = stats?.high_risk_accounts || 0;
  const critical = stats?.critical_accounts || 0;

  const chartData = [
    { name: "Low Risk (<25)", value: low, percent: Math.round((low / total) * 100) },
    { name: "Medium Risk (25-49)", value: medium, percent: Math.round((medium / total) * 100) },
    { name: "High Risk (50-74)", value: high, percent: Math.round((high / total) * 100) },
    { name: "Critical (≥75)", value: critical, percent: Math.round((critical / total) * 100) },
  ].filter((d) => d.value > 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
      <h3 className="text-sm font-semibold text-white">
        Account Risk Distribution
      </h3>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Breakdown of {total} accounts evaluated by Rule Engine & XGBoost
      </p>

      {loading ? (
        <div className="flex h-52 items-center justify-center text-xs text-slate-500">
          Loading distribution...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-xs text-slate-500">
          No account data available.
        </div>
      ) : (
        <div className="mt-3 flex h-52 items-center">
          <div className="h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#071019",
                    border: "1px solid #334155",
                    borderRadius: "6px",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2.5 pl-2">
            {chartData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-300 text-[11px]">{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="font-bold text-white">{item.value}</span>
                  <span className="text-slate-500">({item.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}