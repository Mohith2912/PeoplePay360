import React from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  primary: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  neutral: "bg-slate-800 text-slate-300 border-slate-700",
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
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide",
        variantStyles[variant] || variantStyles.neutral,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
