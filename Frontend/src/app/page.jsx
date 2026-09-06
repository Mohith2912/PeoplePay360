"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, hasCheckedSession, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (hasCheckedSession && !isLoading) {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [hasCheckedSession, isLoading, isAuthenticated, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl border border-blue-200 bg-blue-50 font-bold text-blue-700 shadow-sm">
        360
      </div>
    </div>
  );
}
