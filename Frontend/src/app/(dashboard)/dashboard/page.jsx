"use client";

import React, { useEffect } from "react";
import {
  DollarSign,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { formatCurrency, formatNumber, getRoleLabel } from "@/lib/utils";
import { CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error, fetchDashboard } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
              Dashboard Overview
            </h1>
            {user?.role && (
              <Badge variant="primary" className="text-xs">
                {getRoleLabel(user.role)} View
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time workforce, attendance, and payroll operations status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>
              {new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Backend Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="glass-card rounded-2xl p-6 border border-slate-800">
            <TableSkeleton rows={4} />
          </div>
        </div>
      )}

      {/* Backend Not Ready / Error State with Retry Button */}
      {!isLoading && error && (
        <ErrorState
          title="Unable to Load Dashboard Data"
          message={error}
          onRetry={() => fetchDashboard()}
          isRetrying={isLoading}
        />
      )}

      {/* Render Real Dashboard Data when Backend response is received */}
      {!isLoading && !error && data && (
        <div className="space-y-8">
          {/* KPI Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Net Salary Paid */}
            <div className="glass-card-interactive p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Net Salary Paid
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-100">
                  {formatCurrency(data.kpis?.totalNetSalaryPaid)}
                </div>
                <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Current Payrun Disbursement</span>
                </div>
              </div>
            </div>

            {/* Payslips Generated */}
            <div className="glass-card-interactive p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Payslips Generated
                </span>
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-100">
                  {formatNumber(data.kpis?.payslipsGenerated)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Active verified payrun items
                </div>
              </div>
            </div>

            {/* Attendance Health */}
            <div className="glass-card-interactive p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Attendance Health
                </span>
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-100">
                  {data.kpis?.attendanceHealth?.presentPercent ?? 0}%
                </div>
                <div className="text-xs text-cyan-400 mt-1">
                  {data.kpis?.attendanceHealth?.present ?? 0} present today
                </div>
              </div>
            </div>

            {/* Approved Time Off */}
            <div className="glass-card-interactive p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Approved Leave
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-slate-100">
                  {data.kpis?.approvedTimeOffDays ?? 0} Days
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {data.pendingTimeOffRequests ?? 0} requests pending
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Pre-Verification Warnings & Conflict Detection */}
          {data.warnings && data.warnings.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-amber-500/30">
              <div className="flex items-center gap-2.5 mb-4 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-base font-semibold">
                  Pre-Payroll Integrity Warnings ({data.warnings.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-800">
                {data.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="py-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">{warning.warningType}</Badge>
                      <span className="text-slate-300">{warning.message}</span>
                    </div>
                    <span className="text-slate-500">Action Required</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Overview Card */}
          {data.attendanceOverview && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800">
              <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Today&apos;s Attendance Breakdown
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xl font-bold text-emerald-400">
                    {data.attendanceOverview.present}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Present</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xl font-bold text-amber-400">
                    {data.attendanceOverview.late}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Late Arrival</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xl font-bold text-rose-400">
                    {data.attendanceOverview.absent}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Absent</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-xl font-bold text-cyan-400">
                    {data.attendanceOverview.coveragePercent}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Coverage</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
