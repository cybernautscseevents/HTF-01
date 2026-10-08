"use client";

import { useState } from "react";
import { ChevronDown, Network, ReceiptText } from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import NetworkGraph from "@/components/investigation/NetworkGraph";
import AccountPanel from "@/components/investigation/AccountPanel";
import FlowReplay from "@/components/investigation/FlowReplay";

import MoneyTrail from "@/components/timeline/MoneyTrail";
import InvestigationRecommendations from "@/components/patterns/InvestigationRecommendations";

export default function InvestigatePage() {
  const [showTransactions, setShowTransactions] = useState(false);
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);

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

        {/* Case Controls */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
            CAS-2026-001
          </div>

          <button
            onClick={() => {
              setShowTransactions(true);
              setShowNetworkDetails(false);
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            <ReceiptText size={16} />
            Load Transaction
          </button>
        </div>

        {/* Network Investigation
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_200px]">
          <NetworkGraph />

          <AccountPanel />
        </div> */}

        {/* Transaction Details */}
        {showTransactions && (
          <div className="space-y-6">
            <MoneyTrail />

            <FlowReplay />

            {/* Load Network Details */}
            <div className="flex justify-center border-t border-slate-800 pt-6">
              <button
                onClick={() => setShowNetworkDetails(true)}
                className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-5 py-2.5 text-sm font-medium text-blue-400 transition hover:bg-blue-500/20"
              >
                <Network size={17} />
                Load Network Details
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Recommended Investigation */}
        {showNetworkDetails && (
          <div>
            <InvestigationRecommendations />
          </div>
        )}
      </div>
    </AppShell>
  );
}