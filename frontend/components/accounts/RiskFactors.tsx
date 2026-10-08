const factors = [
  {
    label: "Multiple unique senders",
    description:
      "Received funds from 20 distinct accounts within a short period.",
    contribution: "+18",
  },
  {
    label: "High forwarding ratio",
    description:
      "Forwarded approximately 92% of received funds.",
    contribution: "+17",
  },
  {
    label: "Very short holding time",
    description:
      "Median time between receiving and forwarding funds was 47 seconds.",
    contribution: "+15",
  },
  {
    label: "Network concentration",
    description:
      "Connected to a suspected relay account and multiple mule accounts.",
    contribution: "+14",
  },
  {
    label: "Cross-case association",
    description:
      "Account appears in two previously reported suspicious networks.",
    contribution: "+11",
  },
];

export default function RiskFactors() {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Risk Factors
        </h3>

        <p className="mt-1 text-[10px] text-slate-500">
          Evidence contributing to the current risk score
        </p>
      </div>

      <div className="space-y-3">

        {factors.map((factor) => (
          <div
            key={factor.label}
            className="rounded-md border border-slate-800 bg-[#071019] p-3"
          >

            <div className="flex items-start justify-between gap-4">

              <div>
                <p className="text-xs font-medium text-slate-300">
                  {factor.label}
                </p>

                <p className="mt-1 text-[10px] leading-4 text-slate-600">
                  {factor.description}
                </p>
              </div>

              <span className="shrink-0 rounded bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400">
                {factor.contribution}
              </span>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}