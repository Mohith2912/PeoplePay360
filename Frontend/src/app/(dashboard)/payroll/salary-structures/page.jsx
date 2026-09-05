"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Settings, Plus, Search, ChevronRight, Lock } from "lucide-react";
import { useSalaryStructureStore } from "@/store/salaryStructureStore";
import { useAuthStore } from "@/store/authStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { SalaryStructureForm } from "@/components/payroll/SalaryStructureForm";
import { canManagePayroll } from "@/lib/permissions";

const STATUS_VARIANT = { ACTIVE: "success", ARCHIVED: "default", DRAFT: "warning" };

export default function SalaryStructuresPage() {
  const { user } = useAuthStore();
  const {
    structures,
    total,
    isLoading,
    isRetrying,
    isSubmitting,
    isPreviewLoading,
    previewResult,
    previewError,
    error,
    errorInfo,
    fieldErrors,
    fetchSalaryStructures,
    createSalaryStructure,
    previewSalaryStructure,
    clearPreview,
    clearError,
  } = useSalaryStructureStore();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canManage = canManagePayroll(user?.role);

  const load = useCallback(
    (isRetry = false) => {
      fetchSalaryStructures({ search }, isRetry);
    },
    [fetchSalaryStructures, search]
  );

  useEffect(() => {
    const id = setTimeout(load, 400);
    return () => clearTimeout(id);
  }, [load]);

  const handleCreate = async (data) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await createSalaryStructure(data);
      setSaveSuccess(true);
      setShowForm(false);
      clearPreview();
      load();
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || "Failed to create salary structure.");
    }
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-3">
        <Lock className="w-10 h-10 text-slate-600" />
        <h2 className="text-slate-300 font-semibold">Access Restricted</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Salary structure management requires <strong>HR_PAYROLL_MANAGER</strong> or <strong>ADMIN</strong> role.
        </p>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-violet-400" />
              New Salary Structure
            </h1>
            <p className="text-sm text-slate-400 mt-1">MONTHLY_FIXED — Calculations performed by backend engine.</p>
          </div>
        </div>

        {saveError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
            {saveError}
          </div>
        )}

        <div className="glass-card p-6 rounded-2xl border border-slate-800 max-w-3xl">
          <SalaryStructureForm
            onSubmit={handleCreate}
            onCancel={() => { setShowForm(false); setSaveError(null); clearPreview(); clearError(); }}
            isLoading={isSubmitting}
            fieldErrors={fieldErrors}
            onPreview={previewSalaryStructure}
            isPreviewLoading={isPreviewLoading}
            previewResult={previewResult}
            previewError={previewError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-violet-400" />
            Salary Structures
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {total > 0 ? `${total} structure${total !== 1 ? "s" : ""} defined` : "Define reusable MONTHLY_FIXED salary rule sets."}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setSaveSuccess(false); }}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-4 h-4" /> New Structure
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          Salary structure created successfully.
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
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
      </div>

      {/* Content */}
      {isLoading && !isRetrying ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <TableSkeleton rows={4} />
        </div>
      ) : error ? (
        <ErrorState
          title="Salary Structure Service Unreachable"
          message={error}
          endpoint={errorInfo?.endpoint || "GET /api/salary-structures"}
          statusCode={errorInfo?.status}
          suggestion={errorInfo?.suggestion || "Live records require Mohith's backend service."}
          onRetry={() => load(true)}
          isRetrying={isRetrying}
          actionLabel="+ New Structure"
          onAction={() => setShowForm(true)}
        />
      ) : structures.length === 0 ? (
        <EmptyState
          icon={Settings}
          title="No Salary Structures"
          description="Create the first salary structure to assign it to employee contracts."
          actionLabel="Create First Structure"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Rules</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{s.name}</div>
                      {s.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">{s.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {s.type || "MONTHLY_FIXED"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-xs">{s.rules?.length ?? 0} rule{s.rules?.length !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANT[s.status] || "default"}>
                        {s.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors">
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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
