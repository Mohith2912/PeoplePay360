"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, BarChart3, Lock, Mail, ShieldCheck, Users } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const ROLE_ACCOUNTS = [
  { label: "Admin", email: "admin@peoplepay360.com" },
  { label: "Employee", email: "employee@peoplepay360.com" },
  { label: "HR Manager", email: "hr_manager@peoplepay360.com" },
  { label: "HR Payroll User", email: "payroll_user@peoplepay360.com" },
  { label: "HR Payroll Manager", email: "payroll_manager@peoplepay360.com" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState(null);

  const selectRole = (accountEmail) => {
    setEmail(accountEmail);
    setPassword("password123");
    setValidationError(null);
    clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setValidationError(null);
    clearError();
    if (!email.trim()) return setValidationError("Please enter your email address.");
    if (!password) return setValidationError("Please enter your password.");
    try {
      await login({ email: email.trim(), password });
      router.push("/dashboard");
    } catch {}
  };

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-[#0d2748] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white font-extrabold text-blue-950">360</div>
          <div><p className="text-lg font-bold">PeoplePay360</p><p className="text-xs uppercase tracking-[0.16em] text-blue-200/75">HR &amp; Payroll Operations</p></div>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Unified workforce operations</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Run HR and payroll with clarity and control.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/80">Employee records, attendance, leave, salary structures and payruns work together in one secure business workspace.</p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[[Users, "Employee records"], [BarChart3, "Live reporting"], [ShieldCheck, "Role-based access"]].map(([Icon, label]) => (
              <div key={label} className="rounded-xl border border-white/12 bg-white/7 p-4"><Icon className="h-5 w-5 text-blue-200" /><p className="mt-3 text-xs font-semibold text-blue-50">{label}</p></div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-blue-200/65">Integrated HR and payroll operations platform</p>
      </section>

      <section className="flex items-center justify-center px-5 py-8 sm:px-10">
        <div className="w-full max-w-[38rem]">
          <div className="mb-6 lg:hidden"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900 font-extrabold text-white">360</div><p className="text-lg font-bold text-slate-900">PeoplePay<span className="text-blue-700">360</span></p></div></div>
          <div className="mb-6"><p className="text-sm font-semibold text-blue-700">Welcome back</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Sign in to your workspace</h2><p className="mt-2 text-sm text-slate-500">Use your company credentials to continue.</p></div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.08)] sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {(validationError || error) && <div role="alert" className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{validationError || error}</span></div>}
              <label className="block text-sm font-semibold text-slate-700">Work email<span className="relative mt-2 block"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" autoComplete="email" className="w-full rounded-lg border py-3 pl-10 pr-4 text-sm" /></span></label>
              <label className="block text-sm font-semibold text-slate-700">Password<span className="relative mt-2 block"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" name="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" autoComplete="current-password" className="w-full rounded-lg border py-3 pl-10 pr-4 text-sm" /></span></label>
              <button type="submit" disabled={isLoading} className="erp-primary-button w-full !py-3 disabled:opacity-60">{isLoading ? "Authenticating..." : <><span>Sign in</span><ArrowRight className="h-4 w-4" /></>}</button>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-600">Role login</p><p className="text-[0.68rem] text-slate-400">Select a role to fill its credentials</p></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLE_ACCOUNTS.map((account) => <button key={account.email} type="button" onClick={() => selectRole(account.email)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"><span className="block text-xs font-bold text-blue-800">{account.label}</span><span className="block truncate text-[0.66rem] text-slate-500">{account.email}</span></button>)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
