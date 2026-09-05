"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Play, ShieldCheck, CreditCard, XCircle,
  ChevronRight, AlertTriangle, RefreshCw, Users, DollarSign
} from "lucide-react";
import { usePayrunStore } from "@/store/payrunStore";
import { useAuthStore } from "@/store/authStore";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { ValidationAuditModal } from "@/components/payroll/ValidationAuditModal";
import { canManagePayroll, canAccessPayroll } from "@/lib/permissions";

// ─── Status stepper configuration ────────────────────────────────────────────

const STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "COMPUTED", label: "Computed" },
  { key: "VALIDATED", label: "Validated" },
  { key: "PAID", label: "Paid" },
];

const STATUS_VARIANT = {
  DRAFT: "default",
  COMPUTED: "warning",
  VALIDATED: "success",
  PAID: "success",
  CANCELLED: "danger",
};

function StatusStepper({ status }) {
  const currentIdx = STEPS.findIndex((s) => s.key === status);
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
        <XCircle className="w-3.5 h-3.5" /> CANCELLED
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              isCurrent
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40"
                : isPast
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-slate-800 text-slate-500 border border-slate-700"
            }`}>
              {isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-px ${isPast ? "bg-emerald-500/40" : "bg-slate-700"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({ onClick, disabled, isLoading, icon: Icon, label, variant = "violet" }) {
  const variants = {
    violet: "bg-violet-600 hover:bg-violet-500 shadow-violet-500/20",
    amber: "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20",
    emerald: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20",
    rose: "bg-rose-600/80 hover:bg-rose-600 shadow-rose-500/10",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg ${variants[variant]}`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {label}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PayrunDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    activePayrun,
    isDetailLoading,
    isDetailRetrying,
    detailError,
    detailErrorInfo,
    actionLoading,
    pendingWarnings,
    isAcknowledgmentRequired,
    fetchPayrunById,
    computePayrun,
    validatePayrun,
    acknowledgeAndValidate,
    dismissWarnings,
    payPayrun,
    cancelPayrun,
    clearActivePayrun,
  } = usePayrunStore();

  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [blockingErrors, setBlockingErrors] = useState([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canAccess = canAccessPayroll(user?.role);
  const canManage = canManagePayroll(user?.role);

  const load = useCallback(
    (isRetry = false) => {
      fetchPayrunById(id, isRetry);
    },
    [fetchPayrunById, id]
  );

  useEffect(() => {
    load();
    return () => clearActivePayrun();
  }, [load, clearActivePayrun]);

  // Show warning modal when store signals acknowledgment required
  useEffect(() => {
    if (isAcknowledgmentRequired && pendingWarnings) {
      setShowValidationModal(true);
    }
  }, [isAcknowledgmentRequired, pendingWarnings]);

  const runAction = async (action, successMsg) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await action();
      setActionSuccess(successMsg);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleCompute = () => runAction(() => computePayrun(id), "Payrun computed successfully.");

  const handleValidate = async () => {
    setActionError(null);
    setActionSuccess(null);
    setBlockingErrors([]);
    try {
      const result = await validatePayrun(id, false);
      if (result) setActionSuccess("Payrun validated successfully.");
      // If result is null, store set isAcknowledgmentRequired → useEffect shows modal
    } catch (err) {
      // Check if blocking errors
      if (err.message?.includes("blocking")) {
        setBlockingErrors([{ message: err.message }]);
        setShowValidationModal(true);
      } else {
        setActionError(err.message);
      }
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAndValidate(id);
      setShowValidationModal(false);
      setActionSuccess("Payrun validated after warning acknowledgment.");
    } catch (err) {
      setActionError(err.message);
      setShowValidationModal(false);
    }
  };

  const handlePay = () => {
    if (!window.confirm("Mark this payrun as PAID? This records that payments have been disbursed. It does not transfer funds.")) return;
    runAction(() => payPayrun(id), "Payrun marked as PAID. Payment completion recorded.");
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    setShowCancelConfirm(false);
    runAction(() => cancelPayrun(id), "Payrun cancelled.");
  };

  const pr = activePayrun;

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isDetailLoading && !isDetailRetrying) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 rounded-xl bg-slate-800 animate-pulse" />
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (detailError) {
    return (
      <div className="space-y-4">
        <Link href="/payroll/payruns" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Payruns
        </Link>
        <ErrorState
          title="Payrun Not Found"
          message={detailError}
          endpoint={detailErrorInfo?.endpoint || `GET /api/payruns/${id}`}
          statusCode={detailErrorInfo?.status}
          suggestion={detailErrorInfo?.suggestion || "The payrun may not exist or the backend is unreachable."}
          onRetry={() => load(true)}
          isRetrying={isDetailRetrying}
        />
      </div>
    );
  }

  if (!pr) return null;

  // ─── Status-based action availability ────────────────────────────────────

  const canCompute = (pr.status === "DRAFT" || pr.status === "COMPUTED") && canAccess;
  const canValidate = pr.status === "COMPUTED" && canManage;
  const canPay = pr.status === "VALIDATED" && canManage;
  const canCancel = (pr.status === "DRAFT" || pr.status === "COMPUTED" || pr.status === "VALIDATED") && canManage;
  const isClosed = pr.status === "PAID" || pr.status === "CANCELLED";

  const totalNet = pr.totals?.netPay ?? pr.lines?.reduce((s, l) => s + (l.netPay ?? 0), 0) ?? null;
  const totalGross = pr.totals?.grossPay ?? pr.lines?.reduce((s, l) => s + (l.grossPay ?? 0), 0) ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Navigation */}
      <Link href="/payroll/payruns" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Payruns
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">{pr.name}</h1>
          <div className="text-sm text-slate-400">
            {pr.month && pr.year
              ? new Date(pr.year, pr.month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" })
              : "—"}{" "}
            · {pr.employeeCount ?? pr.lines?.length ?? "—"} employees · v{pr.version ?? "?"}
          </div>
          <StatusStepper status={pr.status} />
        </div>

        {/* Actions */}
        {!isClosed && (
          <div className="flex flex-wrap gap-2">
            {canCompute && (
              <ActionButton
                onClick={handleCompute}
                isLoading={actionLoading.compute}
                icon={Play}
                label={pr.status === "COMPUTED" ? "Recompute" : "Compute"}
                variant="violet"
              />
            )}
            {canValidate && (
              <ActionButton
                onClick={handleValidate}
                isLoading={actionLoading.validate}
                icon={ShieldCheck}
                label="Validate"
                variant="amber"
              />
            )}
            {canPay && (
              <ActionButton
                onClick={handlePay}
                isLoading={actionLoading.pay}
                icon={CreditCard}
                label="Mark as Paid"
                variant="emerald"
              />
            )}
            {canCancel && (
              <ActionButton
                onClick={handleCancel}
                isLoading={actionLoading.cancel}
                icon={XCircle}
                label="Cancel"
                variant="rose"
              />
            )}
          </div>
        )}
      </div>

      {/* Action feedback */}
      {actionError && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25">
          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-rose-300">{actionError}</div>
          <button onClick={() => load(true)} className="ml-auto text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          {actionSuccess}
        </div>
      )}

      {/* Mark as Paid notice */}
      {pr.status === "VALIDATED" && canManage && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300">
            <strong>Mark as Paid</strong> records that salary payments have been disbursed. It does not initiate a fund transfer — payment processing must be handled separately.
          </p>
        </div>
      )}

      {/* Totals cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Employees", value: pr.employeeCount ?? pr.lines?.length ?? "—", icon: Users },
          { label: "Gross Pay", value: totalGross != null ? `₹${Number(totalGross).toLocaleString("en-IN")}` : "Pending", icon: DollarSign },
          { label: "Total Deductions", value: pr.totals?.totalDeductions != null ? `₹${Number(pr.totals.totalDeductions).toLocaleString("en-IN")}` : "Pending", icon: DollarSign },
          { label: "Net Pay", value: totalNet != null ? `₹${Number(totalNet).toLocaleString("en-IN")}` : "Pending", icon: DollarSign, highlight: true },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`p-4 rounded-xl border ${stat.highlight ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-900/50 border-slate-800"}`}>
              <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                <Icon className="w-3 h-3" /> {stat.label}
              </div>
              <div className={`text-lg font-bold ${stat.highlight ? "text-emerald-400" : "text-slate-200"}`}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Employee payrun lines table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" /> Employee Payslip Lines
          </h2>
          {pr.status === "DRAFT" && (
            <span className="text-xs text-slate-500 italic">Run Compute to populate payslip lines.</span>
          )}
        </div>

        {!pr.lines || pr.lines.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">
            {pr.status === "DRAFT"
              ? "No payslip lines yet. Click Compute to generate them."
              : "No payslip lines found for this payrun."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Gross Pay</th>
                  <th className="px-6 py-3 font-medium">Deductions</th>
                  <th className="px-6 py-3 font-medium">Net Pay</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pr.lines.map((line) => (
                  <tr key={line.id ?? line.employeeId} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-200">{line.employeeName || line.employeeId}</div>
                      {line.department && <div className="text-[11px] text-slate-500">{line.department}</div>}
                    </td>
                    <td className="px-6 py-3 text-slate-300">
                      {line.grossPay != null ? `₹${Number(line.grossPay).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending</span>}
                    </td>
                    <td className="px-6 py-3 text-rose-400">
                      {line.totalDeductions != null ? `−₹${Number(line.totalDeductions).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending</span>}
                    </td>
                    <td className="px-6 py-3 font-semibold text-emerald-400">
                      {line.netPay != null ? `₹${Number(line.netPay).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending</span>}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={line.status === "ERROR" ? "danger" : line.netPay != null ? "success" : "default"}>
                        {line.status || (line.netPay != null ? "COMPUTED" : "PENDING")}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      {line.payslipId ? (
                        <Link
                          href={`/payroll/payslips/${line.payslipId}`}
                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-700">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validation Modal */}
      <ValidationAuditModal
        isOpen={showValidationModal}
        onClose={() => {
          setShowValidationModal(false);
          dismissWarnings();
          setBlockingErrors([]);
        }}
        warnings={pendingWarnings || []}
        blockingErrors={blockingErrors}
        isAcknowledgmentRequired={isAcknowledgmentRequired && blockingErrors.length === 0}
        onAcknowledge={handleAcknowledge}
        isLoading={actionLoading.validate}
      />

      {/* Cancel confirm */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
          <div className="relative w-full max-w-sm bg-[#0d1117] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Cancel Payrun
            </h3>
            <p className="text-sm text-slate-400">
              Cancelling <strong className="text-slate-200">{pr.name}</strong> will stop payroll processing for this period. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-sm hover:text-slate-200 transition-colors"
              >
                Keep Payrun
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
