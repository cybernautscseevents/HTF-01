const metrics = [
  ["Incoming txns", "20"],
  ["Outgoing txns", "1"],
  ["Total received", "₹20,000"],
  ["Total forwarded", "₹18,400 (92%)"],
  ["Unique senders", "20"],
  ["Unique receivers", "1"],
  ["Median hold time", "47 seconds"],
];

export default function AccountPanel() {
  return (
    <aside className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Account A
          </h3>

          <p className="mt-3 text-[10px] text-slate-500">
            Account ID
          </p>

          <p className="text-xs text-slate-200">
            AX9341
          </p>
        </div>

        <span className="rounded bg-red-500/20 px-2 py-1 text-[9px] font-medium text-red-400">
          High Risk
        </span>
      </div>

      {/* Risk */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Risk Score</span>

          <span className="font-medium text-white">
            91 / 100
          </span>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-[91%] rounded-full bg-red-500" />
        </div>
      </div>

      {/* Role */}
      <div className="mt-4">
        <p className="text-[10px] text-slate-500">
          Role
        </p>

        <p className="mt-1 text-xs text-slate-200">
          Aggregator (Possible Mule)
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-5 grid grid-cols-2 rounded border border-slate-800 p-1">
        <button className="rounded bg-blue-600 px-2 py-1.5 text-[10px] text-white">
          Key Metrics
        </button>

        <button className="px-2 py-1.5 text-[10px] text-slate-500">
          Recent Transactions
        </button>
      </div>

      {/* Metrics */}
      <div className="mt-3">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between border-b border-slate-800 py-2 text-[10px]"
          >
            <span className="text-slate-500">
              {label}
            </span>

            <span className="text-right text-slate-200">
              {value}
            </span>
          </div>
        ))}
      </div>

      <button className="mt-5 w-full rounded-md bg-blue-600 py-2 text-[10px] font-medium text-white transition hover:bg-blue-500">
        View Full Details →
      </button>
    </aside>
  );
}