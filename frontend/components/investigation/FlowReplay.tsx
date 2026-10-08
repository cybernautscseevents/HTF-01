"use client";

import { Play } from "lucide-react";

export default function FlowReplay() {
  return (
    <div className="flex items-center gap-4 border-t border-slate-800 bg-[#071019] px-4 py-3">

      <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500">
        <Play size={12} fill="currentColor" />
      </button>

      <span className="text-[10px] text-slate-400">
        10:31:04
      </span>

      <span className="hidden text-[10px] text-slate-500 lg:block">
        Transaction flow replay
      </span>

      <div className="relative h-1 flex-1 rounded-full bg-slate-700">
        <div className="h-full w-[45%] rounded-full bg-blue-500" />

        <div className="absolute left-[45%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
      </div>

      <span className="text-[10px] text-slate-400">
        10:34:34
      </span>
    </div>
  );
}