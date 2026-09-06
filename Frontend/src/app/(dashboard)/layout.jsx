"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, isLoading, hasCheckedSession, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (hasCheckedSession && !isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [hasCheckedSession, isLoading, isAuthenticated, router]);

  // Loading skeleton screen while verifying session
  if (isLoading || !hasCheckedSession) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-6 text-slate-900">
        <div className="space-y-4 max-w-sm w-full text-center">
          <div className="mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-xl border border-blue-200 bg-blue-50 font-bold text-blue-700">
            360
          </div>
          <p className="text-sm font-medium text-slate-600">
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
    <div className="app-shell flex min-h-screen">
      {isMenuOpen && <button type="button" className="mobile-overlay md:hidden" aria-label="Close navigation" onClick={() => setIsMenuOpen(false)} />}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="app-main flex flex-col">
        <Navbar onMenuToggle={() => setIsMenuOpen(true)} />
        <main className="page-content flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
