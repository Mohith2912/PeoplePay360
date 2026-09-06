"use client";

import React, { useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileText, Download, Mail, Printer,
  AlertTriangle, CheckCircle2
} from "lucide-react";
import { usePayslipStore } from "@/store/payslipStore";
import { useAuthStore } from "@/store/authStore";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { canManagePayroll, canAccessPayroll, isEmployee } from "@/lib/permissions";

/**
 * Payslip Detail Page — itemised payslip document.
 *
 * Access:
 * - EMPLOYEE: can view their own payslips (backend enforces ownership via employeeId match).
 * - HR_PAYROLL_USER: can view any payslip detail.
 * - HR_PAYROLL_MANAGER / ADMIN: can view, download PDF, and email payslip.
 *
 * PDF: calls backend endpoint which returns a PDF blob.
 * Browser Print: window.print() for browser PDF/print as fallback.
 * Email: calls POST /api/payslips/:id/email (payroll manager/admin only).
 */
export default function PayslipDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();

  const {
    activePayslip,
    isDetailLoading,
    isDetailRetrying,
    detailError,
    detailErrorInfo,
    isPdfDownloading,
    pdfError,
    isEmailing,
    emailError,
    emailSuccess,
    fetchPayslipById,
    downloadPdf,
    emailPayslip,
    clearActivePayslip,
    clearEmailState,
    clearPdfError,
  } = usePayslipStore();

  const canManage = canManagePayroll(user?.role);
  const canAccess = canAccessPayroll(user?.role) || isEmployee(user?.role);

  const load = useCallback(
    (isRetry = false) => {
      fetchPayslipById(id, isRetry);
    },
    [fetchPayslipById, id]
  );

  useEffect(() => {
    load();
    return () => clearActivePayslip();
  }, [load, clearActivePayslip]);

  const ps = activePayslip;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isDetailLoading && !isDetailRetrying) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 rounded-xl bg-slate-800 animate-pulse" />
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (detailError) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link href="/payroll/payslips" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Payslips
        </Link>
        <ErrorState
          title="Payslip Unavailable"
          message={detailError}
          endpoint={detailErrorInfo?.endpoint || `GET /api/payslips/${id}`}
          statusCode={detailErrorInfo?.status}
          suggestion={detailErrorInfo?.suggestion || "The payslip may not exist, you may not have access, or the backend is unreachable."}
          onRetry={() => load(true)}
          isRetrying={isDetailRetrying}
        />
      </div>
    );
  }

  if (!ps) return null;

  const period = ps.month && ps.year
    ? new Date(ps.year, ps.month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" })
    : "—";

  const earnings = ps.items?.filter((it) => !it.type?.includes("DEDUCTION")) || [];
  const deductions = ps.items?.filter((it) => it.type?.includes("DEDUCTION")) || [];

  const handlePdfDownload = async () => {
    clearPdfError();
    try {
      await downloadPdf(id, `Payslip_${ps.employeeName || ps.employeeId}_${period}.pdf`);
    } catch {
      // pdfError set in store
    }
  };

  const handleEmail = async () => {
    clearEmailState();
    try {
      await emailPayslip(id);
    } catch {
      // emailError set in store
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/payroll/payslips" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Payslips
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2 no-print">
          {/* Browser print (all roles) */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl transition-colors"
            title="Print / Save as PDF via browser"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>

          {/* Backend PDF download (all roles with payroll access) */}
          {canAccess && (
            <button
              onClick={handlePdfDownload}
              disabled={isPdfDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl disabled:opacity-40 transition-colors"
            >
              {isPdfDownloading ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {isPdfDownloading ? "Downloading..." : "Download PDF"}
            </button>
          )}

          {/* Email (manager/admin only) */}
          {canManage && (
            <button
              onClick={handleEmail}
              disabled={isEmailing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl disabled:opacity-40 transition-colors"
            >
              {isEmailing ? (
                <div className="w-3.5 h-3.5 border-2 border-violet-300/30 border-t-violet-300 rounded-full animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              {isEmailing ? "Sending..." : "Email to Employee"}
            </button>
          )}
        </div>
      </div>

      {/* Action feedback */}
      {pdfError && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 no-print">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <div className="text-sm text-rose-300">{pdfError} — Try <button onClick={() => window.print()} className="underline text-rose-200">browser print</button> as an alternative.</div>
        </div>
      )}
      {emailError && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 no-print">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300">{emailError}</p>
        </div>
      )}
      {emailSuccess && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 no-print">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm text-emerald-300">Payslip emailed to the employee successfully.</p>
        </div>
      )}

      {/* Payslip document */}
      <div id="payslip-print" className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-r from-violet-900/40 to-fuchsia-900/30 border-b border-slate-800 px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-xs">360</div>
                <span className="text-sm font-semibold text-slate-300">PeoplePay360</span>
              </div>
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" /> Payslip
              </h1>
              <p className="text-sm text-slate-400 mt-1">Pay Period: <strong className="text-slate-200">{period}</strong></p>
            </div>
            <div className="text-right">
              <Badge variant={ps.status === "PAID" ? "success" : "default"}>{ps.status || "GENERATED"}</Badge>
              <div className="text-[11px] text-slate-500 mt-2">Slip ID: {ps.id}</div>
              {ps.payrunId && <div className="text-[11px] text-slate-600">Payrun: {ps.payrunId}</div>}
            </div>
          </div>
        </div>

        {/* Employee info */}
        <div className="px-8 py-5 border-b border-slate-800 bg-slate-900/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Employee Name", value: ps.employeeName || "—" },
              { label: "Employee ID", value: ps.employeeId || "—" },
              { label: "Department", value: ps.department || "—" },
              { label: "Designation", value: ps.designation || ps.jobPosition || "—" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xs text-slate-500 mb-0.5">{item.label}</div>
                <div className="font-medium text-slate-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div>
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">Earnings</h3>
            {earnings.length === 0 && ps.grossPay == null ? (
              <p className="text-xs text-slate-600 italic">Pending input — earnings not yet computed.</p>
            ) : (
              <div className="space-y-2">
                {earnings.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-slate-200 font-medium">
                      {item.amount != null ? `₹${Number(item.amount).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending input</span>}
                    </span>
                  </div>
                ))}
                {earnings.length === 0 && ps.grossPay != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Gross Earnings</span>
                    <span className="text-slate-200 font-medium">₹{Number(ps.grossPay).toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold border-t border-slate-800 pt-2 mt-2">
                  <span className="text-slate-300">Total Earnings</span>
                  <span className="text-emerald-400">
                    {ps.grossPay != null ? `₹${Number(ps.grossPay).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending input</span>}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-3">Deductions</h3>
            {deductions.length === 0 && ps.totalDeductions == null ? (
              <p className="text-xs text-slate-600 italic">Pending input — deductions not yet computed.</p>
            ) : (
              <div className="space-y-2">
                {deductions.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-rose-400 font-medium">
                      {item.amount != null ? `−₹${Number(item.amount).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending input</span>}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-slate-800 pt-2 mt-2">
                  <span className="text-slate-300">Total Deductions</span>
                  <span className="text-rose-400">
                    {ps.totalDeductions != null ? `−₹${Number(ps.totalDeductions).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending input</span>}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Net Pay band */}
        <div className="mx-8 mb-8 p-5 rounded-xl bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">Net Take-Home Pay</div>
            <div className="text-xs text-slate-600">Gross Earnings − Total Deductions</div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {ps.netPay != null
              ? `₹${Number(ps.netPay).toLocaleString("en-IN")}`
              : <span className="text-slate-600 text-base italic font-normal">Pending input</span>}
          </div>
        </div>

        {/* Footer note */}
        <div className="px-8 pb-6 text-xs text-slate-600 text-center">
          This is a computer-generated payslip. For queries, contact HR at hr@peoplepay360.com
        </div>
      </div>
    </div>
  );
}
