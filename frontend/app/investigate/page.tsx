"use client";

import { useState } from "react";
import { Network, Play, ReceiptText } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import NetworkGraph from "@/components/investigation/NetworkGraph";
import AccountPanel from "@/components/investigation/AccountPanel";
import MoneyTrail from "@/components/timeline/MoneyTrail";
import InvestigationRecommendations from "@/components/patterns/InvestigationRecommendations";

export default function InvestigatePage() {
  const [caseId, setCaseId] = useState("CAS-2026-001");
  const [showTransactions, setShowTransactions] = useState(false);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

  const handleLoadTransaction = () => {
    setShowTransactions(true);
    setShowNetworkDetails(false);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Network Investigation
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Explore the money trail and connections
          </p>
        </div>

        {/* Investigation Controls */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Enter network ID"
              className="w-56 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            <button
              onClick={handleLoadTransaction}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              <ReceiptText size={16} />
              Load Transaction
            </button>
          </div>

          <button
            onClick={() => {
              // Simulation logic will be added later.
            }}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
          >
            <Play size={16} />
            Simulation
          </button>
        </div>

        {/* Network Investigation
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_200px]">
          <NetworkGraph />

          <AccountPanel />
        </div> */}
        {/* Transaction Details */}
        {showTransactions && (
          <div className="space-y-6">
            <MoneyTrail />

            {/* Load Network Details */}
            <div className="flex justify-center border-t border-slate-800 pt-6">
              <button
                onClick={() => setShowNetworkDetails(true)}
                className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20 hover:text-blue-300"
              >
                <Network size={17} />
                Load Network Details
              </button>
            </div>
          </div>
        )}

        {/* Recommended Investigation */}
        {showNetworkDetails && (
          <InvestigationRecommendations />
        )}
      </div>
    </AppShell>
  );
}