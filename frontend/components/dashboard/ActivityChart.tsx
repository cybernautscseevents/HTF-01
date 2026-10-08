"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { date: "Sep 1", normal: 28, suspicious: 20 },
  { date: "Sep 3", normal: 35, suspicious: 18 },
  { date: "Sep 5", normal: 42, suspicious: 24 },
  { date: "Sep 7", normal: 36, suspicious: 21 },
  { date: "Sep 10", normal: 30, suspicious: 27 },
  { date: "Sep 12", normal: 43, suspicious: 22 },
  { date: "Sep 14", normal: 35, suspicious: 29 },
  { date: "Sep 17", normal: 40, suspicious: 25 },
  { date: "Sep 21", normal: 34, suspicious: 48 },
  { date: "Sep 24", normal: 45, suspicious: 31 },
  { date: "Sep 26", normal: 52, suspicious: 26 },
  { date: "Sep 28", normal: 58, suspicious: 20 },
];

export default function ActivityChart() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">
          Suspicious Activity Trend
        </h3>

        <div className="flex gap-4 text-[10px]">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Normal
          </span>

          <span className="flex items-center gap-1 text-slate-400">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Suspicious
          </span>
        </div>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              stroke="#1e293b"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#64748b", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              contentStyle={{
                background: "#071019",
                border: "1px solid #334155",
                borderRadius: "6px",
                fontSize: "11px",
              }}
            />

            <Line
              type="monotone"
              dataKey="normal"
              stroke="#22d3a3"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="suspicious"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}