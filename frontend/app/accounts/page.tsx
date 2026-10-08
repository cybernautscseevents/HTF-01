import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

const accounts = [
  {
    id: "AX9341",
    score: 91,
    role: "Aggregator",
  },
  {
    id: "BX7821",
    score: 94,
    role: "Relay",
  },
  {
    id: "CX1102",
    score: 92,
    role: "Mule",
  },
  {
    id: "DX6678",
    score: 88,
    role: "Mule",
  },
];

export default function AccountsPage() {
  return (
    <AppShell>
      <div className="space-y-5">

        <div>
          <h2 className="text-lg font-semibold text-white">
            Accounts
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            High-risk accounts identified across suspicious networks
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

          <table className="w-full text-left text-[10px]">

            <thead className="border-b border-slate-800 text-slate-500">
              <tr>
                <th className="pb-3">Account ID</th>
                <th className="pb-3">Risk Score</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {accounts.map((account) => (
                <tr
                  key={account.id}
                  className="border-b border-slate-800/60"
                >
                  <td className="py-3 text-slate-300">
                    {account.id}
                  </td>

                  <td className="py-3 text-red-400">
                    {account.score}/100
                  </td>

                  <td className="py-3 text-slate-400">
                    {account.role}
                  </td>

                  <td className="py-3">
                    <Link
                      href={`/accounts/${account.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Investigate →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </div>
    </AppShell>
  );
}