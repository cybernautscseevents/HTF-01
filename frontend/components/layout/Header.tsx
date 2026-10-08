"use client";

import { Bell, ChevronDown, Search } from "lucide-react";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#071019] px-6">
      {/* Left */}
      <div>
        <h1 className="text-sm font-semibold text-white">
          Financial Crime Network Investigation
        </h1>

        <p className="mt-0.5 text-[10px] text-slate-500">
          Detect • Trace • Understand • Prevent
        </p>
      </div>

      {/* Center Search */}
      <div className="hidden w-80 md:block">
        <div className="flex items-center rounded-md border border-slate-700 bg-[#0b1621] px-3">
          <Search size={14} className="text-slate-500" />

          <input
            type="text"
            placeholder="Search account ID, transaction ID or case ID..."
            className="w-full bg-transparent px-2 py-2 text-xs text-white outline-none placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="text-slate-400 hover:text-white">
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-600 text-[10px] font-semibold text-white">
            A
          </div>

          <span className="text-xs text-slate-300">
            Analyst
          </span>

          <ChevronDown size={13} className="text-slate-500" />
        </div>
      </div>
    </header>
  );
}