"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Briefcase, FileText, Edit, Clock, CalendarOff, WalletCards } from "lucide-react";
import { useEmployeeStore } from "@/store/employeeStore";
import { useContractStore } from "@/store/contractStore";
import { useAuthStore } from "@/store/authStore";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { ContractForm } from "@/components/contracts/ContractForm";
import { canAccessHR } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "contracts", label: "Contracts", icon: FileText },
];

const CONTRACT_STATUS_VARIANT = {
  ACTIVE: "success",
  DRAFT: "default",
  ENDED: "secondary",
  CANCELLED: "danger",
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    activeEmployee,
    isLoading,
    isRetrying,
    isSubmitting,
    error,
    errorInfo,
    notFound,
    fetchEmployeeById,
    updateEmployee,
    clearActiveEmployee,
    clearError,
  } = useEmployeeStore();
  const {
    contracts,
    isLoading: contractsLoading,
    isSubmitting: contractSubmitting,
    error: contractError,
    fieldErrors: contractFieldErrors,
    fetchContractsByEmployee,
    createContract,
    clearError: clearContractError,
  } = useContractStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingContract, setIsAddingContract] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const canManage = canAccessHR(user?.role);

  useEffect(() => {
    fetchEmployeeById(id);
    fetchContractsByEmployee(id);
    return () => clearActiveEmployee();
  }, [id]);

  const handleUpdateEmployee = async (data) => {
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await updateEmployee(id, data);
      setSaveSuccess("Employee updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || "Update failed. Please try again.");
    }
  };

  const handleCreateContract = async (data) => {
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await createContract({ ...data, employeeId: id });
      setSaveSuccess("Contract created successfully.");
      setIsAddingContract(false);
      fetchContractsByEmployee(id);
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || "Failed to create contract.");
    }
  };

  // 404 — backend confirmed employee doesn't exist
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-4xl">
          🔍
        </div>
        <h2 className="text-xl font-bold text-slate-100">Employee Not Found</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          No employee with ID <span className="font-mono text-violet-400">{id}</span> exists in the system. It may have been removed or the ID is incorrect.
        </p>
        <button
          onClick={() => router.push("/employees")}
          className="mt-2 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </button>
      </div>
    );
  }

  // Network / connection error
  if (!isLoading && error && !activeEmployee) {
    return (
      <ErrorState
        title="Employee Service Connection Error"
        message={error}
        endpoint={errorInfo?.endpoint || `GET /api/employees/${id}`}
        statusCode={errorInfo?.status}
        suggestion={errorInfo?.suggestion || "Verify that the backend service is running and accessible."}
        onRetry={() => fetchEmployeeById(id, true)}
        isRetrying={isRetrying}
      />
    );
  }

  // Loading skeleton
  if (isLoading && !activeEmployee) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const emp = activeEmployee;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => router.push("/employees")}
          className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {emp && (
          <div className="flex items-center gap-4 flex-1">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold">
              {emp.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">{emp.name}</h1>
              <p className="text-sm text-slate-400">{emp.jobPosition} · {emp.department}</p>
            </div>
            <Badge
              variant={emp.employmentStatus === "ACTIVE" ? "success" : emp.employmentStatus === "TERMINATED" ? "danger" : "warning"}
              className="ml-auto"
            >
              {emp.employmentStatus?.replace("_", " ")}
            </Badge>
          </div>
        )}
      </div>

      {/* Save feedback */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm">
          {saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
          {saveError}
        </div>
      )}

      {emp && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Contracts", href: `/contracts?employeeId=${id}`, icon: FileText, count: contracts.length },
            { label: "Attendance", href: `/attendance?employeeId=${id}`, icon: Clock },
            { label: "Time Off", href: `/time-off/requests?employeeId=${id}`, icon: CalendarOff },
            { label: "Allocations", href: `/time-off/allocations?employeeId=${id}`, icon: WalletCards },
          ].map((item) => (
            <Link key={item.label} href={item.href} className="glass-card flex items-center justify-between rounded-xl border border-slate-800 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-violet-500/40 hover:text-violet-300">
              <span className="flex items-center gap-2"><item.icon className="h-4 w-4" />{item.label}</span>
              {item.count != null && <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">{item.count}</span>}
            </Link>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSaveError(null); setSaveSuccess(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && emp && (
        <div className="space-y-6">
          {isEditing ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 max-w-4xl">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Edit Employee Details</h2>
              <EmployeeForm
                initialData={emp}
                onSubmit={handleUpdateEmployee}
                isLoading={isSubmitting}
                onCancel={() => { setIsEditing(false); setSaveError(null); }}
              />
            </div>
          ) : (
            <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-violet-400" /> Employee Details
                </h2>
                {canManage && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/30 hover:bg-violet-500/10 transition-all"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
                {[
                  ["Full Name", emp.name],
                  ["Email", emp.email],
                  ["Phone", emp.phone || "—"],
                  ["Department", emp.department],
                  ["Job Position", emp.jobPosition],
                  ["Employment Type", emp.employeeType?.replace("_", " ")],
                  ["Working Schedule", emp.workingSchedule?.name || "—"],
                  ["Status", emp.employmentStatus?.replace("_", " ")],
                  ["Date of Joining", formatDate(emp.dateOfJoining)],
                ].map(([label, value]) => (
                  <div key={label} className="px-6 py-4">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
                    <div className="text-sm text-slate-200 font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Employment Contracts</h2>
            {canManage && !isAddingContract && (
              <button
                onClick={() => setIsAddingContract(true)}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/30 hover:bg-violet-500/10 transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> New Contract
              </button>
            )}
          </div>

          {isAddingContract && (
            <div className="glass-card p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Create New Contract</h3>
              <ContractForm
                onSubmit={handleCreateContract}
                isLoading={contractSubmitting}
                fieldErrors={contractFieldErrors}
                onCancel={() => { setIsAddingContract(false); clearContractError(); setSaveError(null); }}
              />
            </div>
          )}

          {contractsLoading ? (
            <CardSkeleton />
          ) : contractError && contracts.length === 0 ? (
            <ErrorState
              title="Failed to Load Contracts"
              message={contractError}
              onRetry={() => fetchContractsByEmployee(id)}
            />
          ) : contracts.length === 0 ? (
            <div className="glass-card rounded-2xl border border-slate-800 p-8 text-center text-slate-400 text-sm">
              No contracts found for this employee.
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div key={contract.id} className="glass-card rounded-2xl border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-200">
                      Contract #{contract.id}
                    </span>
                    <Badge variant={CONTRACT_STATUS_VARIANT[contract.status] || "default"}>
                      {contract.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500 mb-0.5">Monthly Wage</div>
                      <div className="text-slate-200 font-medium">{formatCurrency(contract.wage)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Start Date</div>
                      <div className="text-slate-200">{formatDate(contract.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">End Date</div>
                      <div className="text-slate-200">{contract.endDate ? formatDate(contract.endDate) : "Open-ended"}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Schedule</div>
                      <div className="text-slate-200">{contract.scheduleName || contract.scheduleId || "—"}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Employee joined</div>
                      <div className="text-slate-200">{formatDate(contract.employeeDateOfJoining || emp.dateOfJoining)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
