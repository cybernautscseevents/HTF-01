"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ExportActions() {
  const handleExport = (type: string) => {
    alert(`${type} export will be connected to the backend.`);
  };

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-slate-400">
        Export Report
      </h2>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => handleExport("PDF")}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <FileText size={17} />
          Export PDF
        </button>

        <button
          onClick={() => handleExport("CSV")}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          <FileSpreadsheet size={17} />
          Export CSV
        </button>

        <button
          onClick={() => handleExport("Investigation Data")}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
        >
          <Download size={17} />
          Export Investigation Data
        </button>
      </div>
    </section>
  );
}