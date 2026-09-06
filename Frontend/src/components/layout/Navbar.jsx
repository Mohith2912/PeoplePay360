"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Search, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getRoleLabel } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0A0F1E]/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input Placeholder */}
      <div className="flex items-center gap-2 max-w-md w-full">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search employees, payruns..."
            className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
          />
        </div>
      </div>

      {/* Right Actions: Notifications & User Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications placeholder */}
        <button
          type="button"
          aria-label="Notifications"
          className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-violet-500 absolute top-2 right-2 ring-2 ring-[#0A0F1E]" />
        </button>

        {/* User Info & Role Tag */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-violet-700/20">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-100">
                  {user.name}
                </span>
                <span className="text-[10px] text-violet-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
