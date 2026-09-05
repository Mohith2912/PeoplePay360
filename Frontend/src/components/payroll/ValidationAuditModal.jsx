"use client";

import React from "react";
import { X, AlertTriangle, ShieldCheck, Ban, CheckCircle2 } from "lucide-react";

/**
 * ValidationAuditModal — two-stage validation acknowledgment.
 *
 * Stage 1 (isAcknowledgmentRequired=true, warnings present):
 *   Shows warnings. User must click "Acknowledge & Validate" to proceed.
 *
 * Stage 2 (blocking errors):
 *   Shows blocking errors. Payrun remains COMPUTED. No proceed action.
 *
 * Design rules:
 * - Warnings do NOT auto-acknowledge. User must explicitly confirm.
 * - Blocking errors cannot be acknowledged; the modal only shows a Close button.
 */
export function ValidationAuditModal({
  isOpen,
  onClose,
  warnings = [],           // Array<{ field?: string, message: string }>
  blockingErrors = [],      // Array<{ field?: string, message: string }>
  isAcknowledgmentRequired = false,
  onAcknowledge,            // () => void — called when user confirms warnings
  isLoading = false,
}) {
  if (!isOpen) return null;

  const hasBlockingErrors = blockingErrors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${hasBlockingErrors ? "border-rose-900/50 bg-rose-500/5" : "border-amber-900/50 bg-amber-500/5"}`}>
          <div className="flex items-center gap-3">
            {hasBlockingErrors ? (
              <Ban className="w-5 h-5 text-rose-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <h2 className={`text-base font-bold ${hasBlockingErrors ? "text-rose-300" : "text-amber-300"}`}>
                {hasBlockingErrors ? "Validation Blocked" : "Validation Warnings"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {hasBlockingErrors
                  ? "These errors must be resolved before proceeding."
                  : "Review these warnings before finalising the payrun."}
              </p>
            </div>
          </div>
          {!isLoading && (
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Blocking errors */}
          {hasBlockingErrors && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Blocking Errors</h3>
              {blockingErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <Ban className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    {err.field && <div className="text-[10px] font-mono text-rose-500 mb-0.5">{err.field}</div>}
                    <div className="text-sm text-rose-300">{err.message}</div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-500 pt-1">
                The payrun status remains <span className="font-mono text-slate-400">COMPUTED</span>. Fix the issues above and re-run Compute before validating.
              </p>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Warnings</h3>
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    {w.field && <div className="text-[10px] font-mono text-amber-500 mb-0.5">{w.field}</div>}
                    <div className="text-sm text-amber-300">{w.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acknowledge notice */}
          {isAcknowledgmentRequired && !hasBlockingErrors && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-300">
                By clicking <strong>Acknowledge &amp; Validate</strong>, you confirm you have reviewed these warnings and accept the payrun as-is. This will move the payrun to <span className="font-mono">VALIDATED</span> status.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors disabled:opacity-40"
          >
            {hasBlockingErrors ? "Close" : "Go Back"}
          </button>

          {isAcknowledgmentRequired && !hasBlockingErrors && (
            <button
              onClick={onAcknowledge}
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Acknowledge &amp; Validate
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
