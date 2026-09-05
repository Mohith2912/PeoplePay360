import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Backend Service Not Ready",
  message = "Unable to connect to the backend service or retrieve data at this time.",
  onRetry,
  isRetrying = false,
  className,
}) {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl border border-rose-500/20 p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-900/20">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-sm">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all shadow-md shadow-violet-600/30 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", isRetrying && "animate-spin")} />
          {isRetrying ? "Connecting..." : "Retry"}
        </button>
      )}
    </div>
  );
}
