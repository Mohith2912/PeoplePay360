"use client";

import React from "react";
import Link from "next/link";
import { DollarSign, FileText, ListOrdered, Settings, ChevronRight, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { canAccessPayroll, canManagePayroll } from "@/lib/permissions";

const PayrollCard = ({ href, icon: Icon, title, description, badge, locked = false }) => (
  <Link
    href={locked ? "#" : href}
    className={`group relative flex flex-col rounded-xl border p-6 transition-all ${
      locked
        ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-55"
        : "border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
    }`}
    onClick={locked ? (e) => e.preventDefault() : undefined}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
        <Icon className="h-5 w-5 text-blue-700" />
      </div>
      {badge && (
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          {badge}
        </span>
      )}
      {locked && <Lock className="w-4 h-4 text-slate-600" />}
    </div>
    <h3 className="mb-1 text-sm font-bold text-slate-800">{title}</h3>
    <p className="flex-1 text-xs leading-5 text-slate-500">{description}</p>
    {!locked && (
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
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
      <div className="erp-page-header">
        <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Payroll operations</p>
        <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <DollarSign className="h-6 w-6 text-blue-700" />
          Payroll Hub
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage salary structures, run monthly payroll, and distribute payslips.
        </p></div>
      </div>

      {/* Navigation cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Payroll workspace</h2>
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
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-slate-600">
          <strong className="text-slate-400">Your access level:</strong> You can view and compute payruns but cannot validate, approve payment, cancel, or email payslips. Those actions require <span className="text-violet-400">HR_PAYROLL_MANAGER</span> or <span className="text-violet-400">ADMIN</span> role.
        </div>
      )}
    </div>
  );
}
