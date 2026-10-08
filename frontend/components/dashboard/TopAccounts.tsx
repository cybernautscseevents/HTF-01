const accounts = [
  {
    id: "AX9341",
    score: 98,
    role: "Distributor",
  },
  {
    id: "BX7821",
    score: 94,
    role: "Relay",
  },
  {
    id: "CX1102",
    score: 92,
    role: "Aggregator",
  },
  {
    id: "DX6678",
    score: 88,
    role: "Mule",
  },
  {
    id: "EX0091",
    score: 85,
    role: "Cash-out",
  },
];

export default function TopAccounts() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">
        Top Suspicious Accounts
      </h3>

      <table className="w-full text-left text-[10px]">
        <thead className="border-b border-slate-800 text-slate-500">
          <tr>
            <th className="pb-2">Account ID</th>
            <th className="pb-2">Risk Score</th>
            <th className="pb-2">Role</th>
          </tr>
        </thead>

        <tbody>
          {accounts.map((account) => (
            <tr
              key={account.id}
              className="border-b border-slate-800/60"
            >
              <td className="py-2 text-slate-300">
                {account.id}
              </td>

              <td className="py-2 font-medium text-red-400">
                {account.score}/100
              </td>

              <td className="py-2 text-slate-400">
                {account.role}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}