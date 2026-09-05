"use client";

import React, { useState } from "react";
import { AlertCircle, RefreshCw, Copy, Check, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Backend Service Not Ready",
  message = "Unable to connect to the backend service or retrieve data at this time.",
  endpoint,
  statusCode,
  suggestion,
  onRetry,
  isRetrying = false,
  actionLabel,
  onAction,
  variant = "card",
  className,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyDiagnostics = () => {
    const info = `Error: ${title}\nMessage: ${message}\nEndpoint: ${endpoint || "N/A"}\nStatus: ${statusCode || "N/A"}\nTimestamp: ${new Date().toISOString()}`;
    navigator.clipboard.writeText(info).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (variant === "banner") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>{title}</span>
              {statusCode && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  HTTP {statusCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRetrying && "animate-spin text-amber-400")} />
              <span>{isRetrying ? "Connecting..." : "Retry"}</span>
            </button>
          )}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-all shadow-md shadow-amber-600/20"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 shadow-2xl relative overflow-hidden",
        className
      )}
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Warning Icon Badge */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/15 to-amber-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/40 relative z-10">
        <AlertCircle className="w-7 h-7" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-slate-100 mb-2 relative z-10">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-300 mb-4 leading-relaxed max-w-md relative z-10">
        {message}
      </p>

      {/* Technical Diagnostics Pills */}
      {(endpoint || statusCode) && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 relative z-10">
          {endpoint && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400">
              <Terminal className="w-3 h-3 text-violet-400" />
              <span>{endpoint}</span>
            </div>
          )}
          {statusCode && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-[11px] font-mono text-rose-400">
              <span>Status: {statusCode}</span>
            </div>
          )}
        </div>
      )}

      {/* Helpful Suggestion */}
      {suggestion && (
        <p className="text-xs text-slate-400 bg-slate-950/40 border border-slate-800/60 rounded-xl px-4 py-2.5 mb-6 max-w-md text-left relative z-10 leading-relaxed">
          <span className="text-violet-400 font-semibold">Note: </span>
          {suggestion}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-lg shadow-violet-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
            <span>{isRetrying ? "Checking Connection..." : "Retry Connection"}</span>
          </button>
        )}

        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all active:scale-95"
          >
            <span>{actionLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyDiagnostics}
          title="Copy error details for reporting"
          className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "Copied" : "Copy Details"}</span>
        </button>
      </div>
    </div>
  );
}
