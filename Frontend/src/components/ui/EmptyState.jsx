import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        "erp-card flex flex-col items-center justify-center rounded-xl p-8 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="erp-primary-button text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
