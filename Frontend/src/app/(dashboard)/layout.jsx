"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading skeleton screen while verifying session
  if (isLoading) {
    return (
      <div className="flex h-screen w-full bg-[#050914] text-slate-100 items-center justify-center p-6">
        <div className="space-y-4 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 mx-auto animate-pulse flex items-center justify-center text-violet-400 font-bold">
            360
          </div>
          <p className="text-sm font-medium text-slate-300">
            Verifying PeoplePay360 Session...
          </p>
          <Skeleton className="h-2 w-full max-w-xs mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#050914] text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
