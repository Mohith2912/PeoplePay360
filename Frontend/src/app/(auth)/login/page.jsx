"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email.trim()) {
      setValidationError("Please enter your email address.");
      return;
    }
    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.push("/dashboard");
    } catch {
      // Handled by store.error
    }
  };

  const handleQuickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password123");
    setValidationError(null);
    clearError();
  };

  return (
    <div className="min-h-screen w-full bg-[#050914] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 mx-auto flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-violet-600/30 mb-3">
            360
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            PeoplePay<span className="text-violet-400">360</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sign in to access your HR & Payroll workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-8 border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {(validationError || error) && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="leading-relaxed">
                  {validationError || error}
                </span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-600/25 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Integration Note / Quick Email Fill for Team Testing */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
              <span>Target Role Accounts (Test Reference)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@peoplepay360.com")}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 text-left transition-colors truncate"
              >
                <span className="text-violet-400 font-semibold block">Admin</span>
                admin@peoplepay360.com
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("payroll_manager@peoplepay360.com")}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 text-left transition-colors truncate"
              >
                <span className="text-cyan-400 font-semibold block">Payroll Mgr</span>
                payroll_manager@...
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("hr_manager@peoplepay360.com")}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 text-left transition-colors truncate"
              >
                <span className="text-emerald-400 font-semibold block">HR Manager</span>
                hr_manager@...
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("payroll_user@peoplepay360.com")}
                className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 text-left transition-colors truncate"
              >
                <span className="text-blue-400 font-semibold block">Payroll User</span>
                payroll_user@...
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("employee@peoplepay360.com")}
                className="p-2 col-span-2 sm:col-span-1 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800 text-slate-300 text-left transition-colors truncate"
              >
                <span className="text-amber-400 font-semibold block">Employee</span>
                employee@...
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-slate-500 mt-6">
          PeoplePay360 Platform • Frontend REST Client
        </p>
      </div>
    </div>
  );
}
