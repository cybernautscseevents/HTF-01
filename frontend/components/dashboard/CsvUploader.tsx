"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Sparkles, Upload, X } from "lucide-react";
import Papa from "papaparse";
import { uploadTransactionsCsv, loadDemoDataset } from "@/lib/api";

export type CsvRow = Record<string, string>;

interface CsvUploaderProps {
  onDataLoaded: (data: CsvRow[], fileName: string) => void;
}

export default function CsvUploader({
  onDataLoaded,
}: CsvUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a valid CSV file.");
      return;
    }

    setLoading(true);

    try {
      // 1. Post to FastAPI backend for 28-D feature extraction & XGBoost + Rule scoring
      await uploadTransactionsCsv(file);

      // 2. Local parse for immediate table rendering
      Papa.parse<CsvRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const cleanedData = results.data.filter((row) =>
            Object.values(row).some((v) => v !== undefined && v !== "")
          );
          setFileName(file.name);
          setRowCount(cleanedData.length);
          onDataLoaded(cleanedData, file.name);
          setLoading(false);
        },
        error: () => {
          setError("Something went wrong while reading the CSV locally.");
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err.message || "Failed to upload and process CSV in backend engine.");
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await loadDemoDataset();
      const demoRows = Array.from({ length: res.stats?.total_transactions || 683 }, (_, i) => ({
        id: `TXN_${i + 1}`,
      }));
      setFileName("synthetic_banking_demo.csv");
      setRowCount(res.stats?.total_transactions || 683);
      onDataLoaded(demoRows, "synthetic_banking_demo.csv");
    } catch (err: any) {
      setError("Failed to load demo dataset: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearFile = () => {
    setFileName("");
    setRowCount(0);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2.5">
            <FileUp size={20} className="text-blue-400" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              Transaction Data Ingestion
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Upload raw CSV bank logs or load the calibrated simulated banking dataset (No database needed).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            onClick={handleLoadDemo}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3.5 py-2.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20"
          >
            <Sparkles size={14} />
            {loading ? "Processing..." : "Load Demo Banking Feed"}
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <Upload size={15} />
            {loading ? "Analyzing..." : "Upload CSV"}
          </button>
        </div>
      </div>

      {fileName && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-slate-200">
                {fileName}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {rowCount.toLocaleString()} transactions extracted & scored via XGBoost + 100-Point Rule Engine
              </p>
            </div>
          </div>

          <button
            onClick={clearFile}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}