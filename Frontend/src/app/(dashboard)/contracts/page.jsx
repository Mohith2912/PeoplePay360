"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileText, Plus, Search } from "lucide-react";
import { useContractStore } from "@/store/contractStore";
import { useAuthStore } from "@/store/authStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { ContractForm } from "@/components/contracts/ContractForm";
import { canAccessHR } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";

const STATUS_VARIANT = {
  ACTIVE: "success",
  DRAFT: "default",
  ENDED: "secondary",
  CANCELLED: "danger",
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function ContractsPage() {
  const { user } = useAuthStore();
  const {
    contracts,
    total,
    isLoading,
    isRetrying,
    isSubmitting,
    error,
    errorInfo,
    fieldErrors,
    fetchContracts,
    createContract,
    clearError,
  } = useContractStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canManage = canAccessHR(user?.role);

  const load = useCallback(
    (isRetry = false) => {
      const employeeId = typeof window === "undefined" ? undefined : new URLSearchParams(window.location.search).get("employeeId") || undefined;
      fetchContracts({ status: statusFilter, search, employeeId }, isRetry);
    },
    [fetchContracts, statusFilter, search]
  );

  useEffect(() => {
    const id = setTimeout(load, 400);
    return () => clearTimeout(id);
  }, [load]);

  const handleCreate = async (data) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await createContract(data);
      setSaveSuccess(true);
      setShowAddForm(false);
      load();
    } catch (err) {
      // fieldErrors are automatically stored in contractStore
      setSaveError(err.response?.data?.message || err.message || "Failed to create contract.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-violet-400" />
            Contracts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {total > 0 ? `${total} contract${total !== 1 ? "s" : ""} on record` : "View and manage all employee employment contracts."}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); setSaveError(null); setSaveSuccess(false); clearError(); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? "Cancel" : "New Contract"}
          </button>
        )}
      </div>

      {/* Success / Error feedback */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          Contract created successfully.
        </div>
      )}
      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
          {saveError}
        </div>
      )}

      {/* Inline Create Form */}
      {showAddForm && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 max-w-4xl">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Create New Contract</h2>
          <ContractForm
            onSubmit={handleCreate}
            isLoading={isSubmitting}
            fieldErrors={fieldErrors}
            onCancel={() => { setShowAddForm(false); setSaveError(null); clearError(); }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name..."
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
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ENDED">Ended</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Content */}
      {isLoading && !isRetrying ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <TableSkeleton rows={5} />
        </div>
      ) : error ? (
        <ErrorState
          title="Contracts Service Unreachable"
          message={error}
          endpoint={errorInfo?.endpoint || "GET /api/contracts"}
          statusCode={errorInfo?.status}
          suggestion={
            errorInfo?.suggestion ||
            "Live records require Mohith's backend service. You can still test contract creation and status transitions."
          }
          onRetry={() => load(true)}
          isRetrying={isRetrying}
          actionLabel={canManage ? "+ New Contract" : undefined}
          onAction={canManage ? () => { setShowAddForm(true); setSaveError(null); } : undefined}
        />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Contracts Found"
          description={
            statusFilter || search
              ? "No contracts match your current filters."
              : "No employment contracts have been created yet."
          }
        />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Employee</th>
                  <th className="px-6 py-4 font-medium">Date Joined</th>
                  <th className="px-6 py-4 font-medium">Wage / Month</th>
                  <th className="px-6 py-4 font-medium">Start Date</th>
                  <th className="px-6 py-4 font-medium">End Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{c.employeeName || `Employee #${c.employeeId}`}</div>
                      <div className="text-[11px] text-slate-500">Contract #{c.id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(c.employeeDateOfJoining)}</td>
                    <td className="px-6 py-4 text-slate-200">{formatCurrency(c.wage)}</td>
                    <td className="px-6 py-4 text-slate-300">{formatDate(c.startDate)}</td>
                    <td className="px-6 py-4 text-slate-300">{c.endDate ? formatDate(c.endDate) : "Open-ended"}</td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANT[c.status] || "default"}>{c.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
