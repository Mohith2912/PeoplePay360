"use client";

import React from "react";
import Link from "next/link";
import { DollarSign, FileText, ListOrdered, Settings, ChevronRight, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { canAccessPayroll, canManagePayroll } from "@/lib/permissions";

const PayrollCard = ({ href, icon: Icon, title, description, badge, locked = false }) => (
  <Link
    href={locked ? "#" : href}
    className={`group relative flex flex-col p-6 rounded-2xl border transition-all ${
      locked
        ? "border-slate-800 bg-slate-900/30 cursor-not-allowed opacity-50"
        : "border-slate-800 bg-slate-900/50 hover:border-violet-500/40 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-violet-500/5"
    }`}
    onClick={locked ? (e) => e.preventDefault() : undefined}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-violet-400" />
      </div>
      {badge && (
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
          {badge}
        </span>
      )}
      {locked && <Lock className="w-4 h-4 text-slate-600" />}
    </div>
    <h3 className="text-sm font-semibold text-slate-200 mb-1">{title}</h3>
    <p className="text-xs text-slate-500 flex-1">{description}</p>
    {!locked && (
      <div className="flex items-center gap-1 mt-4 text-xs text-slate-500 group-hover:text-violet-400 transition-colors">
        Open <ChevronRight className="w-3.5 h-3.5" />
      </div>
    )}
  </Link>
);

export default function PayrollHubPage() {
  const { user } = useAuthStore();
  const canAccessPay = canAccessPayroll(user?.role);
  const canManage = canManagePayroll(user?.role);

  if (!canAccessPay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-3">
        <Lock className="w-10 h-10 text-slate-600" />
        <h2 className="text-slate-300 font-semibold">Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Payroll features are available to <strong>HR Payroll</strong> roles and admins. Contact your administrator if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-violet-400" />
          Payroll Hub
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage salary structures, run monthly payroll, and distribute payslips.
        </p>
      </div>

      {/* Quick stats (will populate when backend is connected) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Salary Structures", value: "—", sub: "defined" },
          { label: "Active Payruns", value: "—", sub: "in progress" },
          { label: "Payslips Issued", value: "—", sub: "this year" },
          { label: "Pending Payment", value: "—", sub: "awaiting mark-as-paid" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="text-xl font-bold text-violet-400">{stat.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
            <div className="text-[10px] text-slate-600">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Navigation cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <PayrollCard
            href="/payroll/salary-structures"
            icon={Settings}
            title="Salary Structures"
            description="Define MONTHLY_FIXED salary rule sets — basic pay, allowances, and deductions — assigned to employee contracts."
            badge={canManage ? "Manager" : "View"}
            locked={!canManage}
          />
          <PayrollCard
            href="/payroll/payruns"
            icon={ListOrdered}
            title="Payruns"
            description="Create, compute, validate, and close monthly payroll batches. Track lifecycle from DRAFT through PAID."
          />
          <PayrollCard
            href="/payroll/payslips"
            icon={FileText}
            title="Payslips"
            description="View itemised payslips, download PDFs (backend-generated), or browse the global payslip registry."
          />
        </div>
      </div>

      {/* Role notice */}
      {!canManage && (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 text-xs text-slate-500">
          <strong className="text-slate-400">Your access level:</strong> You can view and compute payruns but cannot validate, approve payment, cancel, or email payslips. Those actions require <span className="text-violet-400">HR_PAYROLL_MANAGER</span> or <span className="text-violet-400">ADMIN</span> role.
        </div>
      )}
    </div>
  );
}
