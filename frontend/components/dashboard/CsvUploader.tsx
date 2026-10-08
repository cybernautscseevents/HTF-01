"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileUp, Upload, X } from "lucide-react";
import Papa from "papaparse";

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
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    setError("");

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        if (results.errors.length > 0) {
          setError("The CSV could not be parsed correctly.");
          return;
        }

        const cleanedData = results.data.filter((row) =>
          Object.values(row).some(
            (value) => value !== undefined && value !== ""
          )
        );

        setFileName(file.name);
        setRowCount(cleanedData.length);

        onDataLoaded(cleanedData, file.name);
      },

      error: () => {
        setError("Something went wrong while reading the CSV.");
      },
    });
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2.5">
            <FileUp size={20} className="text-blue-400" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">
              Transaction Data
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Upload a CSV file to generate the financial crime dashboard.
            </p>
          </div>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleInputChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            <Upload size={16} />
            Upload CSV
          </button>
        </div>
      </div>

      {fileName && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <CheckCircle2
              size={18}
              className="text-emerald-400"
            />

            <div>
              <p className="text-sm font-medium text-slate-200">
                {fileName}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                {rowCount.toLocaleString()} transactions loaded
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