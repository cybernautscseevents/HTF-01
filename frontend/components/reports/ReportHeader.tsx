import { FileText, ShieldAlert } from "lucide-react";

export default function ReportHeader() {
  return (
    <div className="flex items-start justify-between border-b border-slate-800 pb-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-cyan-400">
          <ShieldAlert size={16} />
          Financial Crime Investigation
        </div>

        <h1 className="text-2xl font-semibold text-white">
          Investigation Report
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Case CAS-2026-001 · UPI Scam Network
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
        <FileText size={16} />
        Generated Report
      </div>
    </div>
  );
}