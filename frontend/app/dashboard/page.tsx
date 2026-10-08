"use client";

import { useState } from "react";

import {
  Users,
  ArrowLeftRight,
  Network,
  ShieldAlert,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import CsvUploader, {
  CsvRow,
} from "@/components/dashboard/CsvUploader";

import StatCard from "@/components/dashboard/StatCard";
import ActivityChart from "@/components/dashboard/ActivityChart";
import RiskDistribution from "@/components/dashboard/RiskDistribution";
import RecentCases from "@/components/dashboard/RecentCases";
import TopAccounts from "@/components/dashboard/TopAccounts";

export default function DashboardPage() {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [fileName, setFileName] = useState("");

  const handleDataLoaded = (
    data: CsvRow[],
    uploadedFileName: string
  ) => {
    setCsvData(data);
    setFileName(uploadedFileName);
  };

  const hasData = csvData.length > 0;

  return (
    <AppShell>
      <div className="space-y-5">

        {/* Page heading */}
        <div>
          <h2 className="text-lg font-semibold text-white">
            Dashboard
          </h2>

          <p className="text-xs text-slate-500">
            Overall statistics and recent suspicious networks
          </p>
        </div>

        {/* CSV Upload */}
        <CsvUploader onDataLoaded={handleDataLoaded} />

        {/* Dashboard */}
        {hasData && (
          <>
            {/* Uploaded file information */}
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-emerald-400">
                  Data loaded successfully
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {fileName} ·{" "}
                  {csvData.length.toLocaleString()} transactions
                </p>
              </div>

              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">
                Ready for analysis
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Accounts"
                value="12,458"
                change="12%"
                icon={Users}
              />

              <StatCard
                title="Transactions"
                value="84,320"
                change="20%"
                icon={ArrowLeftRight}
              />

              <StatCard
                title="Suspicious Networks"
                value="28"
                change="4 new"
                positive={false}
                icon={Network}
              />

              <StatCard
                title="High Risk Accounts"
                value="126"
                change="18%"
                positive={false}
                icon={ShieldAlert}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <ActivityChart />
              <RiskDistribution />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
              <RecentCases />
              <TopAccounts />
            </div>
          </>
        )}

      </div>
    </AppShell>
  );
}