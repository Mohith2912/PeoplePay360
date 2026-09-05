"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Users, Plus, Search, ChevronRight, Briefcase, Mail } from "lucide-react";
import { useEmployeeStore } from "@/store/employeeStore";
import { useAuthStore } from "@/store/authStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { canAccessHR } from "@/lib/permissions";

const STATUS_VARIANT = {
  ACTIVE: "success",
  NOTICE_PERIOD: "warning",
  TERMINATED: "danger",
};

export default function EmployeesPage() {
  const { user } = useAuthStore();
  const {
    employees,
    total,
    isLoading,
    isRetrying,
    isSubmitting,
    error,
    errorInfo,
    fetchEmployees,
    createEmployee,
  } = useEmployeeStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const load = useCallback(
    (isRetry = false) => {
      fetchEmployees({ search, department, status }, isRetry);
    },
    [fetchEmployees, search, department, status]
  );

  // Debounced search
  useEffect(() => {
    const id = setTimeout(load, 400);
    return () => clearTimeout(id);
  }, [load]);

  const canManageEmployees = canAccessHR(user?.role);

  const handleCreate = async (data) => {
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await createEmployee(data);
      setSaveSuccess(true);
      setShowAddForm(false);
      load();
    } catch (err) {
      setSaveError(
        err.response?.data?.message || err.message || "Failed to create employee. Check your connection."
      );
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Add New Employee</h1>
            <p className="text-sm text-slate-400 mt-1">Create a new employee record in the system.</p>
          </div>
        </div>

        {saveError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
            {saveError}
          </div>
        )}

        <div className="glass-card p-6 rounded-2xl border border-slate-800 max-w-4xl">
          <EmployeeForm
            onSubmit={handleCreate}
            isLoading={isSubmitting}
            onCancel={() => { setShowAddForm(false); setSaveError(null); }}
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
            <Users className="w-6 h-6 text-violet-400" />
            Employee Master
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {total > 0 ? `${total} employee${total !== 1 ? "s" : ""} in the system` : "Manage employee records and organizational data."}
          </p>
        </div>
        {canManageEmployees && (
          <button
            onClick={() => { setShowAddForm(true); setSaveSuccess(false); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        )}
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          Employee created successfully. The record is now in the system.
        </div>
      )}

      {/* Filters toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <input
          type="text"
          placeholder="Department..."
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-40 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-44 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 appearance-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="NOTICE_PERIOD">Notice Period</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Content */}
      {isLoading && !isRetrying ? (
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <TableSkeleton rows={5} />
        </div>
      ) : error ? (
        <ErrorState
          title="Employee Service Unreachable"
          message={error}
          endpoint={errorInfo?.endpoint || "GET /api/employees"}
          statusCode={errorInfo?.status}
          suggestion={
            errorInfo?.suggestion ||
            "Live records require Mohith's backend service. You can still test the creation form and field validation."
          }
          onRetry={() => load(true)}
          isRetrying={isRetrying}
          actionLabel={canManageEmployees ? "+ Add Employee" : undefined}
          onAction={canManageEmployees ? () => setShowAddForm(true) : undefined}
        />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Employees Found"
          description={
            search || department || status
              ? "No employees match your current filters. Try adjusting your search."
              : "Your employee directory is empty. Add the first employee to get started."
          }
          actionLabel={canManageEmployees && !search && !department && !status ? "Add First Employee" : undefined}
          onAction={canManageEmployees && !search && !department && !status ? () => setShowAddForm(true) : undefined}
        />
      ) : (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Employee</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Role & Department</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-sm flex-shrink-0">
                          {emp.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">{emp.name}</div>
                          <div className="text-[11px] text-slate-500">ID: {emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                        <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">{emp.email}</span>
                      </div>
                      {emp.phone && <div className="text-[11px] text-slate-500 mt-0.5">{emp.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-300 text-sm font-medium">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        {emp.jobPosition || "—"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{emp.department || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANT[emp.employmentStatus] || "default"}>
                        {emp.employmentStatus?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors"
                      >
                        View Profile
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
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
