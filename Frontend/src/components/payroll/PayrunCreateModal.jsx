"use client";

import React, { useState, useEffect } from "react";
import { X, Users, Building2, UserCheck, Calendar, ChevronDown } from "lucide-react";

const SCOPE_OPTIONS = [
  {
    value: "ALL_ELIGIBLE",
    label: "All Eligible Employees",
    icon: Users,
    description: "Include every active employee with a salary structure assigned.",
  },
  {
    value: "BY_DEPARTMENT",
    label: "By Department",
    icon: Building2,
    description: "Include only employees in the specified department.",
  },
  {
    value: "SPECIFIC_EMPLOYEES",
    label: "Specific Employees",
    icon: UserCheck,
    description: "Hand-pick specific employee IDs.",
  },
];

/**
 * PayrunCreateModal — creates a new payrun.
 *
 * Employee scope options are MUTUALLY EXCLUSIVE.
 * Month/year are user-selected; the backend determines eligibility.
 */
export function PayrunCreateModal({ onClose, onSubmit, isLoading = false, fieldErrors = [] }) {
  const [name, setName] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [scope, setScope] = useState("ALL_ELIGIBLE");
  const [department, setDepartment] = useState("");
  const [employeeIds, setEmployeeIds] = useState("");
  const [errors, setErrors] = useState({});

  const fieldErrorMap = fieldErrors.reduce((acc, fe) => {
    acc[fe.field] = fe.message;
    return acc;
  }, {});

  // Auto-generate name from month
  useEffect(() => {
    if (month) {
      const [year, mon] = month.split("-");
      const label = new Date(Number(year), Number(mon) - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
      setName(`Payrun – ${label}`);
    }
  }, [month]);

  const validate = () => {
    const errs = {};
    if (!month) errs.month = "Period month is required.";
    if (scope === "BY_DEPARTMENT" && !department.trim()) errs.department = "Department is required.";
    if (scope === "SPECIFIC_EMPLOYEES") {
      const ids = employeeIds.split(",").map((s) => s.trim()).filter(Boolean);
      if (ids.length === 0) errs.employeeIds = "Enter at least one employee ID.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const [year, mon] = month.split("-");
    const payload = {
      name: name.trim(),
      month: Number(mon),
      year: Number(year),
      scope,
      ...(scope === "BY_DEPARTMENT" && { department: department.trim() }),
      ...(scope === "SPECIFIC_EMPLOYEES" && {
        employeeIds: employeeIds.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              Create Payrun
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Define the period and employee scope.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Period */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Pay Period <span className="text-rose-400">*</span>
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
            {(errors.month || fieldErrorMap.month) && (
              <p className="text-rose-400 text-xs mt-1">{errors.month || fieldErrorMap.month}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Payrun Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Payrun – September 2026"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>

          {/* Employee Scope — mutually exclusive radio-style cards */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-400">Employee Scope</label>
            {SCOPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = scope === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setScope(opt.value); setDepartment(""); setEmployeeIds(""); }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-violet-500/60 bg-violet-500/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-violet-500/20" : "bg-slate-800"}`}>
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-violet-400" : "text-slate-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-medium ${isSelected ? "text-violet-300" : "text-slate-300"}`}>{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>
                  </div>
                  <div className={`ml-auto mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${isSelected ? "border-violet-500 bg-violet-500" : "border-slate-600"}`}>
                    {isSelected && <div className="w-full h-full rounded-full bg-white scale-50 block" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Conditional inputs */}
          {scope === "BY_DEPARTMENT" && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Department <span className="text-rose-400">*</span>
              </label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering, Finance..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60"
              />
              {errors.department && <p className="text-rose-400 text-xs mt-1">{errors.department}</p>}
            </div>
          )}

          {scope === "SPECIFIC_EMPLOYEES" && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Employee IDs <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={employeeIds}
                onChange={(e) => setEmployeeIds(e.target.value)}
                rows={3}
                placeholder="EMP001, EMP002, EMP003..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60 resize-none"
              />
              <p className="text-xs text-slate-600 mt-1">Comma-separated employee IDs.</p>
              {errors.employeeIds && <p className="text-rose-400 text-xs mt-1">{errors.employeeIds}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Creating..." : "Create Payrun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
