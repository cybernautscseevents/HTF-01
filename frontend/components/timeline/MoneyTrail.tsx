"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
} from "lucide-react";

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

const flow = [
  {
    id: "V1",
    role: "Victim",
    amount: "₹1,000",
    type: "victim",
  },
  {
    id: "V2",
    role: "Victim",
    amount: "₹1,000",
    type: "victim",
  },
  {
    id: "V3",
    role: "Victim",
    amount: "₹1,000",
    type: "victim",
  },
  {
    id: "V4",
    role: "Victim",
    amount: "₹3,000",
    type: "victim",
  },
  {
    id: "V5",
    role: "Victim",
    amount: "₹13,400",
    type: "victim",
  },
  {
    id: "A",
    role: "Aggregator",
    amount: "₹18,400",
    type: "aggregator",
  },
  {
    id: "B",
    role: "Relay",
    amount: "₹13,000",
    type: "relay",
  },
  {
    id: "C",
    role: "Mule",
    amount: "₹5,000",
    type: "mule",
  },
  {
    id: "D",
    role: "Mule",
    amount: "₹4,000",
    type: "mule",
  },
  {
    id: "E",
    role: "Mule",
    amount: "₹4,000",
    type: "mule",
  },
];

function getNodeStyle(type: string) {
  switch (type) {
    case "victim":
      return "border-blue-500/50 bg-blue-500/10 text-blue-300";

    case "aggregator":
      return "border-red-500/60 bg-red-500/10 text-red-300";

    case "relay":
      return "border-orange-500/60 bg-orange-500/10 text-orange-300";

    case "mule":
      return "border-amber-500/60 bg-amber-500/10 text-amber-300";

    default:
      return "border-slate-700 bg-slate-900 text-slate-300";
  }
}

export default function MoneyTrail() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60">
      {/* Header */}
      <div className="border-b border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2">
          <CircleDollarSign size={18} className="text-blue-400" />

          <div>
            <h2 className="text-base font-semibold text-white">
              Money Trail Timeline
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Chronological reconstruction of transaction movement
            </p>
          </div>
        </div>
      </div>

      {/* Visual Flow */}
      <div className="border-b border-slate-800 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-300">
              Transaction Flow
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Follow the movement of funds from victims to downstream accounts
            </p>
          </div>

          <div className="hidden text-xs text-slate-500 sm:block">
            10:31:04 → 10:34:34
          </div>
        </div>

        <div className="overflow-x-auto pb-3">
          <div className="flex min-w-max items-center justify-center gap-2 py-4">
            {flow.map((node, index) => (
              <div key={`${node.id}-${index}`} className="flex items-center">
                <div
                  className={`group min-w-[105px] rounded-xl border px-3 py-3 text-center transition hover:-translate-y-0.5 ${getNodeStyle(
                    node.type
                  )}`}
                >
                  <div className="text-sm font-semibold">
                    {node.id}
                  </div>

                  <div className="mt-1 text-[11px] opacity-80">
                    {node.role}
                  </div>

                  <div className="mt-2 text-xs font-medium text-white">
                    {node.amount}
                  </div>
                </div>

                {index < flow.length - 1 && (
                  <ArrowRight
                    size={17}
                    className="mx-1 shrink-0 text-slate-600"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flow Explanation */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs font-medium text-blue-300">
              01 · Collection
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Multiple victim accounts send funds into the aggregator.
            </p>
          </div>

          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-xs font-medium text-red-300">
              02 · Aggregation & Relay
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Funds are consolidated and rapidly forwarded through the relay.
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs font-medium text-amber-300">
              03 · Distribution
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              The relay splits funds across multiple downstream accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-300">
            Transaction Details
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Individual transfers reconstructed from the network
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="px-3 py-3 font-medium">Time</th>
                <th className="px-3 py-3 font-medium">From</th>
                <th className="px-3 py-3 font-medium">To</th>
                <th className="px-3 py-3 font-medium">Amount</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Description</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction, index) => {
                const incoming = transaction.type === "Incoming";

                return (
                  <tr
                    key={`${transaction.time}-${index}`}
                    className="border-b border-slate-900 transition hover:bg-slate-900/60"
                  >
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">
                      {transaction.time}
                    </td>

                    <td className="px-3 py-3 text-sm font-medium text-slate-300">
                      {transaction.from}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                        <ArrowRight size={14} className="text-slate-600" />
                        {transaction.to}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-sm font-semibold text-white">
                      {transaction.amount}
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          incoming
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {incoming ? (
                          <ArrowDownRight size={12} />
                        ) : (
                          <ArrowUpRight size={12} />
                        )}

                        {transaction.type}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-xs text-slate-500">
                      {transaction.note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}