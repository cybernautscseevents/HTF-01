"use client";

import { useState } from "react";

const tabs = [
  "Overview",
  "Transactions",
  "Connections",
  "Risk Analysis",
];

export default function AccountTabs() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1621]">

      <div className="flex overflow-x-auto border-b border-slate-800">

        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-5 py-3 text-[10px] transition ${
              activeTab === tab
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}

      </div>

      <div className="p-5">

        {activeTab === "Overview" && (
          <OverviewContent />
        )}

        {activeTab === "Transactions" && (
          <Placeholder
            title="Transaction History"
            description="Incoming and outgoing transactions associated with this account."
          />
        )}

        {activeTab === "Connections" && (
          <Placeholder
            title="Account Connections"
            description="Accounts directly connected through transaction activity."
          />
        )}

        {activeTab === "Risk Analysis" && (
          <Placeholder
            title="Risk Analysis"
            description="Behavioral and network-based risk indicators."
          />
        )}

      </div>

    </div>
  );
}

function OverviewContent() {
  const metrics = [
    ["Incoming Transactions", "20"],
    ["Outgoing Transactions", "1"],
    ["Unique Senders", "20"],
    ["Unique Receivers", "1"],
    ["Total Received", "₹20,000"],
    ["Total Forwarded", "₹18,400"],
    ["Forwarding Ratio", "92%"],
    ["Median Hold Time", "47 seconds"],
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

      {metrics.map(([label, value]) => (
        <div
          key={label}
          className="rounded-md border border-slate-800 bg-[#071019] p-3"
        >
          <p className="text-[9px] text-slate-600">
            {label}
          </p>

          <p className="mt-2 text-sm font-medium text-slate-200">
            {value}
          </p>
        </div>
      ))}

    </div>
  );
}

function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="py-8 text-center">
      <h3 className="text-sm font-medium text-slate-300">
        {title}
      </h3>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}