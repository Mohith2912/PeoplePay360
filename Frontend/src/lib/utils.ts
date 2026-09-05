import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";
import type {
  UserRole,
  EmployeeStatus,
  AttendanceStatus,
  TimeOffRequestStatus,
  PayrunStatus,
  PayslipStatus,
  SalaryRuleCategory,
} from "@/types";

// ─── Class merging ────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(date: string | Date | undefined, fmt = "dd MMM yyyy"): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return isValid(d) ? format(d, fmt) : "—";
  } catch {
    return "—";
  }
}

export function formatDateTime(date: string | Date | undefined): string {
  return formatDate(date, "dd MMM yyyy, HH:mm");
}

export function formatTime(date: string | Date | undefined): string {
  return formatDate(date, "HH:mm");
}

export function formatPeriod(start: string, end: string): string {
  return `${formatDate(start, "MMM yyyy")}`;
}

export function formatMonthYear(date: string): string {
  return formatDate(date, "MMM yyyy");
}

// ─── Currency formatting ──────────────────────────────────────────────────────

export function formatCurrency(
  amount: number | undefined | null,
  currency = "INR"
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number | undefined | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN").format(n);
}

export function numberToWords(amount: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  const int = Math.floor(Math.abs(amount));
  const dec = Math.round((Math.abs(amount) - int) * 100);
  let result = convert(int) || "Zero";
  result += " Rupees";
  if (dec > 0) result += ` and ${convert(dec)} Paise`;
  result += " Only";
  return result;
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE:            "Employee",
  HR_MANAGER:          "HR Manager",
  HR_PAYROLL_USER:     "HR Payroll User",
  HR_PAYROLL_MANAGER:  "HR Payroll Manager",
  ADMIN:               "Admin",
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function canAccessPayroll(role: UserRole): boolean {
  return ["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function canManagePayroll(role: UserRole): boolean {
  return ["HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function canAccessHR(role: UserRole): boolean {
  return ["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function canApproveLeave(role: UserRole): boolean {
  return ["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}

// ─── Status badge configs ─────────────────────────────────────────────────────

type BadgeVariant = { label: string; className: string };

export const EMPLOYEE_STATUS_MAP: Record<EmployeeStatus, BadgeVariant> = {
  ACTIVE:        { label: "Active",        className: "badge-success" },
  NOTICE_PERIOD: { label: "Notice Period", className: "badge-warning" },
  TERMINATED:    { label: "Terminated",    className: "badge-danger"  },
};

export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatus, BadgeVariant> = {
  PRESENT:   { label: "Present",   className: "badge-success" },
  LATE:      { label: "Late",      className: "badge-warning" },
  ABSENT:    { label: "Absent",    className: "badge-danger"  },
  EXCEPTION: { label: "Exception", className: "badge-info"    },
};

export const TIME_OFF_STATUS_MAP: Record<TimeOffRequestStatus, BadgeVariant> = {
  PENDING:  { label: "Pending",  className: "badge-warning" },
  APPROVED: { label: "Approved", className: "badge-success" },
  REJECTED: { label: "Rejected", className: "badge-danger"  },
};

export const PAYRUN_STATUS_MAP: Record<PayrunStatus, BadgeVariant> = {
  DRAFT:     { label: "Draft",     className: "badge-info"    },
  COMPUTED:  { label: "Computed",  className: "badge-warning" },
  VALIDATED: { label: "Validated", className: "badge-primary" },
  PAID:      { label: "Paid",      className: "badge-success" },
};

export const PAYSLIP_STATUS_MAP: Record<PayslipStatus, BadgeVariant> = {
  DRAFT:     { label: "Draft",     className: "badge-info"    },
  COMPUTED:  { label: "Computed",  className: "badge-warning" },
  VALIDATED: { label: "Validated", className: "badge-primary" },
  PAID:      { label: "Paid",      className: "badge-success" },
};

export const SALARY_CATEGORY_MAP: Record<SalaryRuleCategory, BadgeVariant> = {
  BASIC:         { label: "Basic",         className: "badge-primary" },
  ALLOWANCE:     { label: "Allowance",     className: "badge-info"    },
  GROSS:         { label: "Gross",         className: "badge-success" },
  DEDUCTION:     { label: "Deduction",     className: "badge-danger"  },
  NET:           { label: "Net",           className: "badge-success" },
  REIMBURSEMENT: { label: "Reimbursement", className: "badge-warning" },
};

// ─── Name helpers ─────────────────────────────────────────────────────────────

export function getFullName(
  entity?: { firstName: string; lastName: string } | null
): string {
  if (!entity) return "—";
  return `${entity.firstName} ${entity.lastName}`.trim();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen = 30): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`;
}

export function generateAvatarColor(name: string): string {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-indigo-500 to-violet-600",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
