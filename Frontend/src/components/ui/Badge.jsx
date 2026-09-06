import React from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  primary: "bg-blue-50 text-blue-700 border-blue-200",
  info: "bg-cyan-50 text-cyan-700 border-cyan-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
};

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold tracking-wide",
        variantStyles[variant] || variantStyles.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
