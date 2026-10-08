"use client";

import { ArrowRight, Clock3 } from "lucide-react";

const transactions = [
  {
    time: "10:31:04",
    from: "V1",
    to: "A",
    amount: "₹1,000",
    type: "Incoming",
    note: "Victim transfer",
  },
  {
    time: "10:31:09",
    from: "V2",
    to: "A",
    amount: "₹1,000",
    type: "Incoming",
    note: "Victim transfer",
  },
  {
    time: "10:31:12",
    from: "V3",
    to: "A",
    amount: "₹1,000",
    type: "Incoming",
    note: "Victim transfer",
  },
  {
    time: "10:31:15",
    from: "V4",
    to: "A",
    amount: "₹3,000",
    type: "Incoming",
    note: "Victim transfer",
  },
  {
    time: "10:31:19",
    from: "V5",
    to: "A",
    amount: "₹13,400",
    type: "Incoming",
    note: "Victim transfer",
  },
  {
    time: "10:34:12",
    from: "A",
    to: "B",
    amount: "₹18,400",
    type: "Outgoing",
    note: "Aggregated transfer (92%)",
  },
  {
    time: "10:34:27",
    from: "B",
    to: "C",
    amount: "₹5,000",
    type: "Outgoing",
    note: "Split transfer",
  },
  {
    time: "10:34:31",
    from: "B",
    to: "D",
    amount: "₹4,000",
    type: "Outgoing",
    note: "Split transfer",
  },
  {
    time: "10:34:34",
    from: "B",
    to: "E",
    amount: "₹4,000",
    type: "Outgoing",
    note: "Split transfer",
  },
];

const filters = [
  {
    label: "All",
    count: 24,
  },
  {
    label: "Victim → Aggregator",
    count: 20,
  },
  {
    label: "Aggregator → Relay",
    count: 1,
  },
  {
    label: "Relay → Mules",
    count: 3,
  },
];

export default function MoneyTrail() {
  return (
    <div className="space-y-4">

      {/* Flow visualization */}
      <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-5">

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Money Trail Timeline
            </h3>

            <p className="mt-1 text-[10px] text-slate-500">
              Chronological flow of transactions in this case
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <Clock3 size={13} />
            10:31:04 — 10:34:34
          </div>
        </div>

        {/* Flow */}
        <div className="flex items-center justify-center overflow-x-auto py-5">

          <FlowNode
            label="V1"
            role="Victim"
            type="victim"
          />

          <Arrow />

          <FlowNode
            label="A"
            role="Aggregator"
            type="aggregator"
          />

          <Arrow />

          <FlowNode
            label="B"
            role="Relay"
            type="relay"
          />

          <Arrow />

          <FlowNode
            label="C"
            role="Mule"
            type="mule"
          />

          <Arrow />

          <FlowNode
            label="D"
            role="Mule"
            type="mule"
          />

          <Arrow />

          <FlowNode
            label="E"
            role="Mule"
            type="mule"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          {filters.map((filter, index) => (
            <button
              key={filter.label}
              className={`rounded-full border px-3 py-1.5 text-[10px] transition ${
                index === 0
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                  : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300"
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* Transaction table */}
      <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">
            Transaction Flow
          </h3>

          <p className="mt-1 text-[10px] text-slate-500">
            Individual transfers reconstructed from the network
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-[10px]">

            <thead className="border-b border-slate-800 text-slate-500">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">From</th>
                <th className="px-3 py-2">To</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction, index) => (
                <tr
                  key={`${transaction.time}-${index}`}
                  className="border-b border-slate-800/60 transition hover:bg-slate-800/30"
                >
                  <td className="px-3 py-3 font-mono text-slate-400">
                    {transaction.time}
                  </td>

                  <td className="px-3 py-3 font-medium text-slate-200">
                    {transaction.from}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <ArrowRight
                        size={12}
                        className="text-slate-600"
                      />

                      <span className="font-medium text-slate-200">
                        {transaction.to}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3 font-medium text-slate-200">
                    {transaction.amount}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={
                        transaction.type === "Incoming"
                          ? "rounded bg-emerald-500/10 px-2 py-1 text-emerald-400"
                          : "rounded bg-red-500/10 px-2 py-1 text-red-400"
                      }
                    >
                      {transaction.type}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-slate-500">
                    {transaction.note}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}

function FlowNode({
  label,
  role,
  type,
}: {
  label: string;
  role: string;
  type: "victim" | "aggregator" | "relay" | "mule";
}) {
  const styles = {
    victim: "border-blue-500 bg-blue-500/10 text-blue-400",
    aggregator: "border-red-500 bg-red-500/10 text-red-400",
    relay: "border-red-500 bg-red-500/10 text-red-400",
    mule: "border-amber-500 bg-amber-500/10 text-amber-400",
  };

  return (
    <div className="flex min-w-[70px] flex-col items-center gap-2">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-semibold ${styles[type]}`}
      >
        {label}
      </div>

      <div className="text-center">
        <p className="text-[10px] font-medium text-slate-300">
          {label}
        </p>

        <p className="text-[9px] text-slate-600">
          {role}
        </p>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="mx-3 text-slate-600">
      <ArrowRight size={16} />
    </div>
  );
}