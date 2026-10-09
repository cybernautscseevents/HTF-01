"use client";

import {
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Investigate", href: "/investigate", icon: Search },
  { name: "Accounts", href: "/accounts", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <aside
      className={`sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-slate-800 bg-[#071019] transition-[width] duration-200 ease-out ${
        isOpen ? "w-56" : "w-[68px]"
      }`}
      aria-label="Main Navigation"
    >
      <div className="flex h-16 shrink-0 items-center border-b border-slate-800">
        {isOpen ? (
          <div className="flex w-full items-center justify-between px-5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <ShieldCheck size={16} />
              </div>
              <span className="whitespace-nowrap text-sm font-semibold text-white">FinGuard</span>
            </div>
            <button
              type="button"
              onClick={toggleSidebar}
              className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-white"
              title="Close sidebar (Ctrl+B)"
              aria-label="Close sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-white"
            title="Open sidebar (Ctrl+B)"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen size={15} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <a
              key={item.name}
              href={item.href}
              title={!isOpen ? item.name : undefined}
              className={`relative flex items-center rounded-md text-xs transition ${
                isOpen ? "gap-3 px-3 py-2" : "mx-auto h-9 w-9 justify-center"
              } ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={15} className="shrink-0" />
              {isOpen && <span className="whitespace-nowrap">{item.name}</span>}
            </a>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-slate-800 py-3 text-[10px] text-slate-600">
        {isOpen ? (
          <div className="flex items-center justify-between px-4">
            <span>FinGuard v1.0</span>
            <kbd className="rounded border border-slate-800 px-1 py-0.5 font-mono text-[9px] text-slate-600">
              Ctrl+B
            </kbd>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex w-full justify-center font-mono text-[10px] text-slate-600 hover:text-slate-300"
            title="Open sidebar (Ctrl+B)"
          >
            v1
          </button>
        )}
      </div>
    </aside>
  );
}
