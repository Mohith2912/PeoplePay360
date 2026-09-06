"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarOff,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { canAccessHR, canAccessPayroll, canViewOwnPayslips, isAdmin } from "@/lib/permissions";
import { cn, getRoleLabel } from "@/lib/utils";

// Visual shell only: route visibility and permission checks are unchanged.
export function Sidebar({ isOpen = false, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const role = user?.role;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visible: true },
    {
      label: role === "EMPLOYEE" ? "My Profile" : "Employees",
      href: role === "EMPLOYEE" && user?.employeeId ? `/employees/${user.employeeId}` : "/employees",
      icon: Users,
      visible: canAccessHR(role) || (role === "EMPLOYEE" && Boolean(user?.employeeId)),
    },
    { label: "Contracts", href: "/contracts", icon: FileText, visible: canAccessHR(role) },
    { label: "Attendance", href: "/attendance", icon: Clock, visible: true },
    { label: "Time Off", href: "/time-off", icon: CalendarOff, visible: true },
    { label: "Payroll", href: "/payroll", icon: DollarSign, visible: canAccessPayroll(role) },
    {
      label: "My Payslips",
      href: "/payroll/payslips",
      icon: FileText,
      visible: canViewOwnPayslips(role) && !canAccessPayroll(role),
    },
    { label: "Reports", href: "/reports", icon: BarChart3, visible: canAccessPayroll(role) || canAccessHR(role) },
    { label: "User Access", href: "/admin", icon: ShieldAlert, visible: isAdmin(role) },
  ];

  return (
    <aside
      className="sidebar-shell sticky top-0 flex h-screen w-[17rem] shrink-0 select-none flex-col text-slate-100"
      data-open={isOpen ? "true" : "false"}
      aria-label="Primary navigation"
    >
      <div className="flex h-[4.5rem] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-extrabold text-blue-900 shadow-sm">
          360
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[1.02rem] font-bold tracking-tight text-white">
            PeoplePay<span className="text-blue-200">360</span>
          </div>
          <div className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-blue-200/75">
            HR &amp; Payroll Operations
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 md:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-blue-200/60">Workspace</p>
        <div className="space-y-1">
          {navItems.filter((item) => item.visible).map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex min-h-11 items-center justify-between rounded-lg px-3 text-sm font-medium",
                  active ? "bg-white text-blue-950 shadow-sm" : "text-blue-50/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className={cn("h-[1.05rem] w-[1.05rem]", active ? "text-blue-700" : "text-blue-200/75")} />
                  {item.label}
                </span>
                {active && <ChevronRight className="h-4 w-4 text-blue-600" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="rounded-xl bg-white/8 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-900">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-[0.68rem] font-medium text-blue-200/80">{getRoleLabel(user.role)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-blue-50 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
