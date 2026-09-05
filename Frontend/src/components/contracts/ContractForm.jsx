import React, { useState } from "react";
import { DollarSign, Calendar, Loader2 } from "lucide-react";

/**
 * ContractForm
 * onSubmit receives: { employeeId?, wage, startDate, endDate?, scheduleId?, structureId?, status }
 * fieldErrors: [{ field: string, message: string }] from backend (e.g. OVERLAPPING_CONTRACT)
 */
export function ContractForm({ initialData, onSubmit, isLoading, onCancel, fieldErrors = [] }) {
  const [formData, setFormData] = useState({
    wage: initialData?.wage ?? "",
    startDate: initialData?.startDate ?? "",
    endDate: initialData?.endDate ?? "",
    scheduleId: initialData?.scheduleId ?? "",
    structureId: initialData?.structureId ?? "",
    status: initialData?.status ?? "DRAFT",
  });

  const [clientErrors, setClientErrors] = useState({});

  // Build a fieldErrors map for quick lookup: { fieldName: message }
  const fieldErrorMap = fieldErrors.reduce((acc, fe) => {
    acc[fe.field] = fe.message;
    return acc;
  }, {});

  const validate = () => {
    const errs = {};
    if (!formData.wage || Number(formData.wage) <= 0)
      errs.wage = "Wage must be a positive number";
    if (!formData.startDate)
      errs.startDate = "Start date is required";
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate)
      errs.endDate = "End date cannot be before start date";
    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const field = (name) => clientErrors[name] || fieldErrorMap[name];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        wage: Number(formData.wage),
        endDate: formData.endDate || null,
        scheduleId: formData.scheduleId || null,
        structureId: formData.structureId || null,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compensation & Term */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Compensation & Term
          </h3>

          {/* Wage */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Monthly Wage (INR)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={1}
                value={formData.wage}
                onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
                className={`w-full bg-slate-900/50 border ${field("wage") ? "border-rose-500/50" : "border-slate-700"} rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
                placeholder="e.g. 50000"
              />
            </div>
            {field("wage") && <p className="text-[10px] text-rose-400">{field("wage")}</p>}
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Start Date (YYYY-MM-DD)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full bg-slate-900/50 border ${field("startDate") ? "border-rose-500/50" : "border-slate-700"} rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
              />
            </div>
            {field("startDate") && <p className="text-[10px] text-rose-400">{field("startDate")}</p>}
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">End Date (optional — leave blank for open-ended)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full bg-slate-900/50 border ${field("endDate") ? "border-rose-500/50" : "border-slate-700"} rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50`}
              />
            </div>
            {field("endDate") && <p className="text-[10px] text-rose-400">{field("endDate")}</p>}
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            Configuration
          </h3>

          {/* Schedule ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Working Schedule ID</label>
            <input
              type="number"
              min={1}
              value={formData.scheduleId}
              onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
              placeholder="e.g. 1 (from GET /api/schedules)"
            />
            {field("scheduleId") && <p className="text-[10px] text-rose-400">{field("scheduleId")}</p>}
          </div>

          {/* Salary Structure ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Salary Structure ID</label>
            <input
              type="number"
              min={1}
              value={formData.structureId}
              onChange={(e) => setFormData({ ...formData, structureId: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
              placeholder="e.g. 1 (from GET /api/salary-structures)"
            />
            <p className="text-[10px] text-slate-500">Choices loaded from GET /api/salary-structures once backend is ready.</p>
            {field("structureId") && <p className="text-[10px] text-rose-400">{field("structureId")}</p>}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">Contract Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 appearance-none"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <p className="text-[10px] text-slate-500">Only one ACTIVE contract per employee is allowed.</p>
          </div>
        </div>
      </div>

      {/* Backend field-level validation errors summary */}
      {fieldErrors.length > 0 && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 space-y-1">
          {fieldErrors.map((fe, i) => (
            <p key={i} className="text-xs text-rose-400">
              <span className="font-semibold">{fe.field}:</span> {fe.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 rounded-xl transition-colors shadow-lg shadow-violet-500/20 disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData ? "Update Contract" : "Create Contract"}
        </button>
      </div>
    </form>
  );
}
