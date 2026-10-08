"use client";

import {
  LayoutDashboard,
  Search,
  Network,
  Users,
  ArrowLeftRight,
  FolderKanban,
  Bell,
  FileText,
  Database,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Investigate",
    href: "/investigate",
    icon: Search,
  },
  {
    name: "Accounts",
    href: "/accounts",
    icon: Users,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-slate-800 bg-[#071019]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600">
          <ShieldCheck size={16} />
        </div>

        <span className="text-sm font-semibold text-white">
          FinGuard
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
  pathname === item.href ||
  pathname.startsWith(`${item.href}/`);

          return (
            <a
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={15} />
              <span>{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Version */}
      <div className="border-t border-slate-800 px-4 py-3 text-[10px] text-slate-600">
        FinGuard v1.0
      </div>
    </aside>
  );
}