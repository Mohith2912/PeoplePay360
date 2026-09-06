"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight, Home, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getRoleLabel } from "@/lib/utils";
import { apiClient } from "@/lib/api";

const pageNames = {
  admin: "User Access",
  attendance: "Attendance",
  contracts: "Contracts",
  dashboard: "Dashboard",
  employees: "Employees",
  payroll: "Payroll",
  payruns: "Payruns",
  payslips: "Payslips",
  reports: "Reports",
  schedules: "Working Schedules",
  "salary-structures": "Salary Structures",
  "time-off": "Time Off",
  allocations: "Allocations",
  types: "Leave Types",
};

export function Navbar({ onMenuToggle }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const segments = pathname.split("/").filter(Boolean);
  const title = [...segments].reverse().map((part) => pageNames[part]).find(Boolean) || "Workspace";
  useEffect(() => {
    if (!user) return;
    apiClient.get("/api/notifications", { params: { limit: 20 } }).then((response) => {
      setNotifications(response.data?.data || []);
      setUnreadCount(response.data?.unreadCount || 0);
    }).catch(() => {});
  }, [user, pathname]);

  const openNotification = async (notification) => {
    if (!notification.readAt) {
      await apiClient.put(`/api/notifications/${notification.id}`).catch(() => {});
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setNotificationsOpen(false);
    if (notification.link) router.push(notification.link);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="topbar-shell sticky top-0 z-30 flex min-h-[4.5rem] items-center gap-4 border-b px-4 sm:px-6">
      <button type="button" onClick={onMenuToggle} aria-label="Open navigation" className="erp-secondary-button !min-h-9 !p-2 md:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-wide text-slate-500">
          <Home className="h-3.5 w-3.5" />
          <span>PeoplePay360</span>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-blue-700">{title}</span>
        </div>
        <h1 className="mt-0.5 truncate text-lg font-bold tracking-tight text-slate-900">{title}</h1>
      </div>

      <div className="relative">
        <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1 text-[0.6rem] font-bold text-white ring-2 ring-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </button>
        {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 px-4 py-3"><p className="text-sm font-bold text-slate-900">Notifications</p><p className="text-xs text-slate-500">{unreadCount} unread</p></div>
          <div className="max-h-80 overflow-y-auto">{notifications.length ? notifications.map((notification) => <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50 ${notification.readAt ? "bg-white" : "bg-blue-50/60"}`}><span className="block text-sm font-semibold text-slate-800">{notification.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{notification.message}</span><span className="mt-1 block text-[0.65rem] text-slate-400">{new Date(notification.createdAt).toLocaleString("en-IN")}</span></button>) : <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>}</div>
        </div>}
      </div>

      {user && (
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-xs font-bold text-white">
            {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="max-w-36 truncate text-xs font-bold text-slate-800">{user.name}</p>
            <p className="flex items-center gap-1 text-[0.65rem] font-semibold text-blue-700"><ShieldCheck className="h-3 w-3" />{getRoleLabel(user.role)}</p>
          </div>
          <button type="button" onClick={handleLogout} aria-label="Logout" title="Logout" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </header>
  );
}
