import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isValid } from "date-fns";

// ─── Class merging ────────────────────────────────────────────────────────────

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(date, fmt = "dd MMM yyyy") {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return isValid(d) ? format(d, fmt) : "—";
  } catch {
    return "—";
  }
}

export function formatDateTime(date) {
  return formatDate(date, "dd MMM yyyy, HH:mm");
}

export function formatTime(date) {
  return formatDate(date, "HH:mm");
}

export function formatPeriod(start, end) {
  return `${formatDate(start, "MMM yyyy")}`;
}

export function formatMonthYear(date) {
  return formatDate(date, "MMM yyyy");
}

// ─── Currency formatting ──────────────────────────────────────────────────────

export function formatCurrency(amount, currency = "INR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-IN").format(n);
}

export function numberToWords(amount) {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convert(n) {
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

export const ROLE_LABELS = {
  EMPLOYEE: "Employee",
  HR_MANAGER: "HR Manager",
  HR_PAYROLL_USER: "HR Payroll User",
  HR_PAYROLL_MANAGER: "HR Payroll Manager",
  ADMIN: "Admin",
};

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "User";
}

// ─── Status badge configs ─────────────────────────────────────────────────────

export const EMPLOYEE_STATUS_MAP = {
  ACTIVE: { label: "Active", className: "badge-success" },
  NOTICE_PERIOD: { label: "Notice Period", className: "badge-warning" },
  TERMINATED: { label: "Terminated", className: "badge-danger" },
};

export const ATTENDANCE_STATUS_MAP = {
  PRESENT: { label: "Present", className: "badge-success" },
  LATE: { label: "Late", className: "badge-warning" },
  ABSENT: { label: "Absent", className: "badge-danger" },
  EXCEPTION: { label: "Exception", className: "badge-info" },
};

export const TIME_OFF_STATUS_MAP = {
  PENDING: { label: "Pending", className: "badge-warning" },
  APPROVED: { label: "Approved", className: "badge-success" },
  REJECTED: { label: "Rejected", className: "badge-danger" },
};

export const PAYRUN_STATUS_MAP = {
  DRAFT: { label: "Draft", className: "badge-info" },
  COMPUTED: { label: "Computed", className: "badge-warning" },
  VALIDATED: { label: "Validated", className: "badge-primary" },
  PAID: { label: "Paid", className: "badge-success" },
};

export const PAYSLIP_STATUS_MAP = {
  DRAFT: { label: "Draft", className: "badge-info" },
  COMPUTED: { label: "Computed", className: "badge-warning" },
  VALIDATED: { label: "Validated", className: "badge-primary" },
  PAID: { label: "Paid", className: "badge-success" },
};

export const SALARY_CATEGORY_MAP = {
  BASIC: { label: "Basic", className: "badge-primary" },
  ALLOWANCE: { label: "Allowance", className: "badge-info" },
  GROSS: { label: "Gross", className: "badge-success" },
  DEDUCTION: { label: "Deduction", className: "badge-danger" },
  NET: { label: "Net", className: "badge-success" },
  REIMBURSEMENT: { label: "Reimbursement", className: "badge-warning" },
};

// ─── Name helpers ─────────────────────────────────────────────────────────────

export function getFullName(entity) {
  if (!entity) return "—";
  return `${entity.firstName || ""} ${entity.lastName || ""}`.trim() || "—";
}

export function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function truncate(str, maxLen = 30) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}
