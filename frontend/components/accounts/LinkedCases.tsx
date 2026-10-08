const cases = [
  {
    id: "CAS-2026-001",
    type: "UPI Scam",
    date: "05 Oct 2026",
    status: "Investigating",
  },
  {
    id: "CAS-2026-007",
    type: "Investment Fraud",
    date: "28 Sep 2026",
    status: "Open",
  },
];

export default function LinkedCases() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Linked Cases
        </h3>

        <p className="mt-1 text-[10px] text-slate-500">
          Cases associated with this account
        </p>
      </div>

      <div className="space-y-2">

        {cases.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border border-slate-800 bg-[#071019] p-3"
          >

            <div>
              <p className="text-xs font-medium text-slate-300">
                {item.id}
              </p>

              <p className="mt-1 text-[9px] text-slate-600">
                {item.type} • {item.date}
              </p>
            </div>

            <span className="rounded bg-blue-500/10 px-2 py-1 text-[9px] text-blue-400">
              {item.status}
            </span>

          </div>
        ))}

      </div>
    </div>
  );
}