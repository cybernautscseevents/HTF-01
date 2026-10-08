"use client";

import { useState } from "react";
import { LockKeyhole, Play } from "lucide-react";

export default function InterventionControls() {
  const [account, setAccount] = useState("BX7821");
  const [simulated, setSimulated] = useState(false);

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621] p-4">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div className="flex-1">

          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Select Intervention Target
          </p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">

            <select
              value={account}
              onChange={(e) => {
                setAccount(e.target.value);
                setSimulated(false);
              }}
              className="rounded-md border border-slate-700 bg-[#071019] px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="AX9341">
                AX9341 — Aggregator
              </option>

              <option value="BX7821">
                BX7821 — Relay
              </option>

              <option value="CX1102">
                CX1102 — Mule
              </option>
            </select>

            <select
              className="rounded-md border border-slate-700 bg-[#071019] px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
            >
              <option>Simulate Account Freeze</option>
              <option>Simulate Transaction Block</option>
              <option>Simulate Enhanced Monitoring</option>
            </select>

          </div>

          <p className="mt-2 text-[9px] text-slate-600">
            Selected target:{" "}
            <span className="text-slate-400">{account}</span>
          </p>

        </div>

        <button
          onClick={() => setSimulated(true)}
          className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-500"
        >
          {simulated ? (
            <LockKeyhole size={14} />
          ) : (
            <Play size={14} />
          )}

          {simulated
            ? "Simulation Complete"
            : "Run Simulation"}
        </button>

      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">

        <LockKeyhole
          size={13}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <p className="text-[9px] leading-4 text-slate-500">
          Simulation only. No actual account, transaction, or
          banking-system action will be performed.
        </p>

      </div>
    </div>
  );
}