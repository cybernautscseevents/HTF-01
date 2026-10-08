"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "Low Risk", value: 72 },
  { name: "Medium Risk", value: 18 },
  { name: "High Risk", value: 8 },
  { name: "Critical", value: 2 },
];

const COLORS = [
  "#22d3a3",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
];

export default function RiskDistribution() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">
      <h3 className="text-sm font-semibold text-white">
        Account Risk Distribution
      </h3>

      <div className="mt-3 flex h-52 items-center">
        <div className="h-40 w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
              >
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-[10px]"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: COLORS[index],
                  }}
                />

                <span className="text-slate-400">
                  {item.name}
                </span>
              </div>

              <span className="text-slate-300">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}