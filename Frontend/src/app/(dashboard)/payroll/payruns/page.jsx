"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ListOrdered, Plus, Search, ChevronRight, Calendar } from "lucide-react";
import { usePayrunStore } from "@/store/payrunStore";
import { useAuthStore } from "@/store/authStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { PayrunCreateModal } from "@/components/payroll/PayrunCreateModal";
import { canAccessPayroll, canManagePayroll } from "@/lib/permissions";

const STATUS_VARIANT = {
  DRAFT: "default",
  COMPUTED: "warning",
  VALIDATED: "success",
  PAID: "success",
  CANCELLED: "danger",
};

const STATUS_ORDER = ["DRAFT", "COMPUTED", "VALIDATED", "PAID", "CANCELLED"];

function formatPeriod(month, year) {
  if (!month || !year) return "—";
  return new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export default function PayrunsPage() {
  const { user } = useAuthStore();
  const {
    payruns,
    total,
    isLoading,
    isRetrying,
    isSubmitting,
    error,
    errorInfo,
    createError,
    createFieldErrors,
    fetchPayruns,
    createPayrun,
    clearCreateError,
  } = usePayrunStore();

  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);
  const [actionError, setActionError] = useState(null);

  const canAccess = canAccessPayroll(user?.role);
  const canManage = canManagePayroll(user?.role);

  const load = useCallback(
    (isRetry = false) => {
      fetchPayruns({ search, status: statusFilter }, isRetry);
    },
    [fetchPayruns, search, statusFilter]
  );

  useEffect(() => {
    const id = setTimeout(load, 400);
    return () => clearTimeout(id);
  }, [load]);

  const handleCreate = async (data) => {
    setActionError(null);
    try {
      await createPayrun(data);
      setCreateSuccess(true);
      setShowCreate(false);
      load();
    } catch (err) {
      // createError is set in store; modal shows field-level errors
    }
  };

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-3">
        <ListOrdered className="w-10 h-10 text-slate-600" />
        <h2 className="text-slate-300 font-semibold">Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-sm">Payrun access requires a Payroll role.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ListOrdered className="w-6 h-6 text-violet-400" />
            Payruns
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {total > 0 ? `${total} payrun${total !== 1 ? "s" : ""} on record` : "Monthly payroll batch management."}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowCreate(true); setCreateSuccess(false); clearCreateError(); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" /> New Payrun
          </button>
        )}
      </div>

      {createSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          Payrun created successfully. Click it to compute employee payslips.
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 appearance-none"
        >
          <option value="">All Statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading && !isRetrying ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <TableSkeleton rows={5} />
        </div>
      ) : error ? (
        <ErrorState
          title="Payrun Service Unreachable"
          message={error}
          endpoint={errorInfo?.endpoint || "GET /api/payruns"}
          statusCode={errorInfo?.status}
          suggestion={errorInfo?.suggestion || "Live payrun data requires Mohith's backend service."}
          onRetry={() => load(true)}
          isRetrying={isRetrying}
          actionLabel={canManage ? "+ New Payrun" : undefined}
          onAction={canManage ? () => setShowCreate(true) : undefined}
        />
      ) : payruns.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Payruns Found"
          description={
            search || statusFilter
              ? "No payruns match your filters. Try adjusting your search."
              : "Create the first payrun to begin payroll processing."
          }
          actionLabel={canManage && !search && !statusFilter ? "Create First Payrun" : undefined}
          onAction={canManage && !search && !statusFilter ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Payrun</th>
                  <th className="px-6 py-4 font-medium">Period</th>
                  <th className="px-6 py-4 font-medium">Employees</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payruns.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{pr.name}</div>
                      <div className="text-[11px] text-slate-500">ID: {pr.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 text-sm">{formatPeriod(pr.month, pr.year)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-xs">{pr.employeeCount ?? "—"} employees</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANT[pr.status] || "default"}>
                        {pr.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/payroll/payruns/${pr.id}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors"
                      >
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <PayrunCreateModal
          onClose={() => { setShowCreate(false); clearCreateError(); }}
          onSubmit={handleCreate}
          isLoading={isSubmitting}
          fieldErrors={createFieldErrors}
        />
      )}
    </div>
  );
}
