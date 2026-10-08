const rows = [
  {
    feature: "Network depth",
    case1: "4 hops",
    case2: "3 hops",
    case3: "4 hops",
    similarity: "High",
  },
  {
    feature: "Unique senders",
    case1: "20",
    case2: "17",
    case3: "24",
    similarity: "High",
  },
  {
    feature: "Forwarding ratio",
    case1: "92%",
    case2: "89%",
    case3: "94%",
    similarity: "High",
  },
  {
    feature: "Median hold time",
    case1: "47 sec",
    case2: "53 sec",
    case3: "41 sec",
    similarity: "High",
  },
  {
    feature: "Downstream accounts",
    case1: "3",
    case2: "4",
    case3: "3",
    similarity: "High",
  },
  {
    feature: "Total value",
    case1: "₹20K",
    case2: "₹34K",
    case3: "₹28K",
    similarity: "Medium",
  },
];

export default function NetworkComparisonTable() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Network Comparison
        </h3>

        <p className="mt-1 text-[10px] text-slate-500">
          Compare structural and behavioral characteristics
        </p>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-[700px] text-left text-[10px]">

          <thead className="border-b border-slate-800 text-slate-500">

            <tr>
              <th className="px-3 py-3">
                Feature
              </th>

              <th className="px-3 py-3">
                CAS-2026-001
              </th>

              <th className="px-3 py-3">
                CAS-2026-007
              </th>

              <th className="px-3 py-3">
                CAS-2026-012
              </th>

              <th className="px-3 py-3">
                Similarity
              </th>
            </tr>

          </thead>

          <tbody>

            {rows.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-slate-800/60"
              >

                <td className="px-3 py-3 font-medium text-slate-300">
                  {row.feature}
                </td>

                <td className="px-3 py-3 text-slate-400">
                  {row.case1}
                </td>

                <td className="px-3 py-3 text-slate-400">
                  {row.case2}
                </td>

                <td className="px-3 py-3 text-slate-400">
                  {row.case3}
                </td>

                <td className="px-3 py-3">
                  <span
                    className={`rounded px-2 py-1 ${
                      row.similarity === "High"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {row.similarity}
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