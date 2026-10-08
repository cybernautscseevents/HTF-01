export default function RiskOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">

      {/* Risk score */}
      <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-5">

        <p className="text-[10px] uppercase tracking-wide text-slate-500">
          Risk Score
        </p>

        <div className="mt-3 flex items-end gap-2">
          <span className="text-4xl font-semibold text-red-400">
            91
          </span>

          <span className="mb-1 text-xs text-slate-600">
            / 100
          </span>
        </div>

        <p className="mt-1 text-xs text-red-400">
          High Risk
        </p>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-[91%] rounded-full bg-red-500" />
        </div>

        <div className="mt-3 flex justify-between text-[9px] text-slate-600">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Critical</span>
        </div>

      </div>

      {/* Account information */}
      <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-5">

        <h3 className="text-sm font-semibold text-white">
          Account Information
        </h3>

        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">

          <Info
            label="Account ID"
            value="AX9341"
          />

          <Info
            label="Account Type"
            value="Savings"
          />

          <Info
            label="Bank"
            value="Demo Bank"
          />

          <Info
            label="Account Age"
            value="2 years 4 months"
          />

          <Info
            label="KYC Status"
            value="Verified"
          />

          <Info
            label="Risk Status"
            value="Under Investigation"
            danger
          />

        </div>
      </div>

    </div>
  );
}

function Info({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] text-slate-600">
        {label}
      </p>

      <p
        className={`mt-1 text-xs ${
          danger
            ? "text-red-400"
            : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}