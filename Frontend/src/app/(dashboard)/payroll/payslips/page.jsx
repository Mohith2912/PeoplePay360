"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FileText, Search, ChevronRight, Calendar } from "lucide-react";
import { usePayslipStore } from "@/store/payslipStore";
import { useAuthStore } from "@/store/authStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { canAccessPayroll, isEmployee } from "@/lib/permissions";

/**
 * Payslips Registry Page
 *
 * - EMPLOYEE role: shows personal /me payslips only.
 * - HR_PAYROLL_USER / HR_PAYROLL_MANAGER / ADMIN: shows the global payslip registry with filters.
 */
export default function PayslipsPage() {
  const { user } = useAuthStore();
  const {
    // Global registry
    payslips,
    total,
    isLoading,
    isRetrying,
    error,
    errorInfo,
    fetchPayslips,
    // Personal /me
    myPayslips,
    myTotal,
    isMyLoading,
    isMyRetrying,
    myError,
    myErrorInfo,
    fetchMyPayslips,
  } = usePayslipStore();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const userIsEmployee = isEmployee(user?.role);
  const canAccess = canAccessPayroll(user?.role) || userIsEmployee;

  const loadGlobal = useCallback(
    (isRetry = false) => {
      fetchPayslips({ search, department: departmentFilter, month: monthFilter, year: yearFilter }, isRetry);
    },
    [fetchPayslips, search, departmentFilter, monthFilter, yearFilter]
  );

  const loadMy = useCallback(
    (isRetry = false) => {
      fetchMyPayslips({}, isRetry);
    },
    [fetchMyPayslips]
  );

  useEffect(() => {
    if (userIsEmployee) {
      loadMy();
    } else {
      const id = setTimeout(loadGlobal, 400);
      return () => clearTimeout(id);
    }
  }, [userIsEmployee, loadGlobal, loadMy]);

  function formatPeriod(month, year) {
    if (!month || !year) return "—";
    return new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
  }

  // ─── Employee: personal /me view ─────────────────────────────────────────

  if (userIsEmployee) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-400" />
            My Payslips
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {myTotal > 0 ? `${myTotal} payslip${myTotal !== 1 ? "s" : ""} on record` : "Your salary payslips issued by the payroll team."}
          </p>
        </div>

        {isMyLoading && !isMyRetrying ? (
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <TableSkeleton rows={4} />
          </div>
        ) : myError ? (
          <ErrorState
            title="Payslips Unavailable"
            message={myError}
            endpoint={myErrorInfo?.endpoint || "GET /api/payslips/me"}
            statusCode={myErrorInfo?.status}
            suggestion={myErrorInfo?.suggestion || "Your payslips require Mohith's backend service."}
            onRetry={() => loadMy(true)}
            isRetrying={isMyRetrying}
          />
        ) : myPayslips.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Payslips Yet"
            description="Your payslips will appear here once payroll has been processed for your salary period."
          />
        ) : (
          <PayslipTable payslips={myPayslips} formatPeriod={formatPeriod} />
        )}
      </div>
    );
  }

  // ─── Payroll roles: global registry ──────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-violet-400" />
          Payslips Registry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {total > 0 ? `${total} payslip${total !== 1 ? "s" : ""} across all employees` : "Global payslip register."}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Employee name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <input
          type="text"
          placeholder="Department..."
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-36 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
        />
        <input
          type="number"
          placeholder="Month (1–12)"
          min={1}
          max={12}
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-32 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
        />
        <input
          type="number"
          placeholder="Year"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {isLoading && !isRetrying ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <TableSkeleton rows={6} />
        </div>
      ) : error ? (
        <ErrorState
          title="Payslip Service Unreachable"
          message={error}
          endpoint={errorInfo?.endpoint || "GET /api/payslips"}
          statusCode={errorInfo?.status}
          suggestion={errorInfo?.suggestion || "Global payslip registry requires Mohith's backend service."}
          onRetry={() => loadGlobal(true)}
          isRetrying={isRetrying}
        />
      ) : payslips.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Payslips Found"
          description={
            search || departmentFilter || monthFilter || yearFilter
              ? "No payslips match your filters. Try adjusting your search."
              : "Payslips appear here after a payrun has been computed."
          }
        />
      ) : (
        <PayslipTable payslips={payslips} formatPeriod={formatPeriod} />
      )}
    </div>
  );
}

function PayslipTable({ payslips, formatPeriod }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-medium">Employee</th>
              <th className="px-6 py-4 font-medium">Period</th>
              <th className="px-6 py-4 font-medium">Net Pay</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {payslips.map((ps) => (
              <tr key={ps.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-200">{ps.employeeName || ps.employeeId}</div>
                  {ps.department && <div className="text-[11px] text-slate-500">{ps.department}</div>}
                </td>
                <td className="px-6 py-4 text-slate-300">{formatPeriod(ps.month, ps.year)}</td>
                <td className="px-6 py-4 font-semibold text-emerald-400">
                  {ps.netPay != null ? `₹${Number(ps.netPay).toLocaleString("en-IN")}` : <span className="text-slate-600 italic text-xs">Pending input</span>}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={ps.status === "PAID" ? "success" : ps.status === "ERROR" ? "danger" : "default"}>
                    {ps.status || "GENERATED"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/payroll/payslips/${ps.id}`}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors"
                  >
                    View <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
