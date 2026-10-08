const cases = [
  {
    id: "CAS-2026-001",
    date: "05 Oct 2026",
    amount: "₹50,000",
    accounts: "12 accounts",
    status: "Critical",
  },
  {
    id: "CAS-2026-002",
    date: "04 Oct 2026",
    amount: "₹1,20,000",
    accounts: "18 accounts",
    status: "High",
  },
  {
    id: "CAS-2026-003",
    date: "03 Oct 2026",
    amount: "₹25,000",
    accounts: "7 accounts",
    status: "Investigating",
  },
  {
    id: "CAS-2026-004",
    date: "02 Oct 2026",
    amount: "₹75,000",
    accounts: "10 accounts",
    status: "High",
  },
  {
    id: "CAS-2026-005",
    date: "01 Oct 2026",
    amount: "₹10,000",
    accounts: "6 accounts",
    status: "Closed",
  },
];

const statusStyles: Record<string, string> = {
  Critical: "bg-red-500/20 text-red-400",
  High: "bg-orange-500/20 text-orange-400",
  Investigating: "bg-blue-500/20 text-blue-400",
  Closed: "bg-emerald-500/20 text-emerald-400",
};

export default function RecentCases() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">
        Recent Suspicious Cases
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead className="border-b border-slate-800 text-slate-500">
            <tr>
              <th className="pb-2">Case ID</th>
              <th className="pb-2">Reported Date</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Detected Network</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>

          <tbody>
            {cases.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-800/60"
              >
                <td className="py-2 text-slate-300">
                  {item.id}
                </td>

                <td className="py-2 text-slate-400">
                  {item.date}
                </td>

                <td className="py-2 text-slate-300">
                  {item.amount}
                </td>

                <td className="py-2 text-slate-400">
                  {item.accounts}
                </td>

                <td className="py-2">
                  <span
                    className={`rounded px-2 py-1 ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}