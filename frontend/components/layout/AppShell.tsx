"use client";

import { Suspense } from "react";
import Sidebar from "./Sidebar";
import { SidebarProvider } from "./SidebarContext";

function AppShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050b11] text-white">
      <Suspense
        fallback={
          <aside className="sticky top-0 z-30 h-screen w-56 shrink-0 border-r border-slate-800 bg-[#071019]" />
        }
      >
        <Sidebar />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-auto p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
