"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ActivityTrendPoint, fetchActivityTrend } from "@/lib/api";

export default function ActivityChart() {
  const [data, setData] = useState<ActivityTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityTrend()
      .then((res) => setData(res))
      .catch((err) => console.error("Error fetching activity trend:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b1621] p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Live Transaction Activity Trend
          </h3>
          <p className="text-[11px] text-slate-500">
            Real-time classification based on ingested transaction history
          </p>
        </div>

        <div className="flex gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Normal Volume
          </span>

          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            Suspicious / Mule Flows
          </span>
        </div>
      </div>

      <div className="h-56">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Aggregating transactional intervals...
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            No transaction records available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#071019",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
              <Line
                type="monotone"
                dataKey="normal"
                name="Normal Transfers"
                stroke="#22d3a3"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22d3a3" }}
              />
              <Line
                type="monotone"
                dataKey="suspicious"
                name="Suspicious Transfers"
                stroke="#f43f5e"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#f43f5e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}