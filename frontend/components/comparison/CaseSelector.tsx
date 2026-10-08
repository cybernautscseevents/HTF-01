"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const cases = [
  {
    id: "CAS-2026-001",
    type: "UPI Scam",
    accounts: 10,
  },
  {
    id: "CAS-2026-007",
    type: "Investment Fraud",
    accounts: 8,
  },
  {
    id: "CAS-2026-012",
    type: "Phishing",
    accounts: 12,
  },
  {
    id: "CAS-2026-019",
    type: "Fake Loan",
    accounts: 7,
  },
];

export default function CaseSelector() {
  const [selected, setSelected] = useState([
    "CAS-2026-001",
    "CAS-2026-007",
    "CAS-2026-012",
  ]);

  function toggleCase(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Select Cases
          </h3>

          <p className="mt-1 text-[10px] text-slate-500">
            Compare suspicious networks across multiple cases
          </p>
        </div>

        <span className="rounded bg-blue-500/10 px-2 py-1 text-[9px] text-blue-400">
          {selected.length} selected
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">

        {cases.map((item) => {
          const isSelected = selected.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => toggleCase(item.id)}
              className={`rounded-md border p-3 text-left transition ${
                isSelected
                  ? "border-blue-500/40 bg-blue-500/5"
                  : "border-slate-800 bg-[#071019] hover:border-slate-700"
              }`}
            >

              <div className="flex items-start justify-between">

                <div>
                  <p className="text-xs font-medium text-slate-300">
                    {item.id}
                  </p>

                  <p className="mt-1 text-[9px] text-slate-600">
                    {item.type}
                  </p>
                </div>

                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    isSelected
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-slate-700 text-transparent"
                  }`}
                >
                  <Check size={11} />
                </div>

              </div>

              <p className="mt-3 text-[9px] text-slate-500">
                {item.accounts} accounts
              </p>

            </button>
          );
        })}

      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">

        <p className="text-[10px] text-slate-600">
          Select at least 2 cases to compare their networks.
        </p>

        <button className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-[10px] font-medium text-white hover:bg-blue-500">
          Compare Networks
          <ChevronDown size={12} className="rotate-[-90deg]" />
        </button>

      </div>

    </div>
  );
}