"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  CalendarOff,
  DollarSign,
  BarChart3,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { canAccessHR, canAccessPayroll, isAdmin } from "@/lib/permissions";
import { getRoleLabel, cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const role = user?.role;

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      visible: true,
    },
    {
      label: "Employees",
      href: "/employees",
      icon: Users,
      visible: canAccessHR(role),
    },
    {
      label: "Contracts",
      href: "/contracts",
      icon: FileText,
      visible: canAccessHR(role),
    },
    {
      label: "Attendance",
      href: "/attendance",
      icon: Clock,
      visible: true,
    },
    {
      label: "Time Off",
      href: "/time-off",
      icon: CalendarOff,
      visible: true,
    },
    {
      label: "Payroll",
      href: "/payroll",
      icon: DollarSign,
      visible: canAccessPayroll(role),
    },
    {
      label: "Reports",
      href: "/reports",
      icon: BarChart3,
      visible: canAccessPayroll(role) || canAccessHR(role),
    },
    {
      label: "Administration",
      href: "/admin",
      icon: ShieldAlert,
      visible: isAdmin(role),
    },
  ];

  const visibleItems = navItems.filter((item) => item.visible);

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#0A0F1E]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-base shadow-md shadow-violet-600/30">
            360
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
              PeoplePay<span className="text-violet-400">360</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              HR & Payroll Ops
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1 mt-2">
          <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Main Menu
          </div>
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-violet-600/15 text-violet-300 border border-violet-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-violet-400"
                        : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-violet-400/80" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Chip */}
      {user && (
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40 m-2 rounded-2xl border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/40 text-violet-300 font-semibold text-xs flex items-center justify-center">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-violet-400 font-medium truncate">
                {getRoleLabel(user.role)}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
