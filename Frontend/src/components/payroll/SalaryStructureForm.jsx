"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Info, AlertTriangle } from "lucide-react";

const RULE_TYPES = [
  { value: "FIXED_ADDITION", label: "Fixed Addition", color: "emerald" },
  { value: "PERCENTAGE_OF_BASE", label: "% of Basic", color: "blue" },
  { value: "FIXED_DEDUCTION", label: "Fixed Deduction", color: "rose" },
  { value: "PERCENTAGE_DEDUCTION", label: "% Deduction", color: "orange" },
];

const emptyRule = () => ({
  _key: Math.random().toString(36).slice(2),
  code: "",
  label: "",
  type: "FIXED_ADDITION",
  value: "",
  baseRuleCode: "",
  isOptional: false,
});

/**
 * SalaryStructureForm — Create / Edit a MONTHLY_FIXED salary structure.
 *
 * Scope: MONTHLY_FIXED only (per Phase 3 agreement).
 * Calculation preview: requested from Mohith's backend. No client-side math.
 */
export function SalaryStructureForm({
  initialData = null,
  onSubmit,
  onCancel,
  isLoading = false,
  fieldErrors = [],
  onPreview,
  isPreviewLoading = false,
  previewResult = null,
  previewError = null,
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [rules, setRules] = useState(
    initialData?.rules?.length > 0 ? initialData.rules.map((r) => ({ ...r, _key: Math.random().toString(36).slice(2) })) : [emptyRule()]
  );
  const [sampleWage, setSampleWage] = useState("");
  const [errors, setErrors] = useState({});

  // Map fieldErrors array to a lookup
  const fieldErrorMap = fieldErrors.reduce((acc, fe) => {
    acc[fe.field] = fe.message;
    return acc;
  }, {});

  const addRule = () => setRules((prev) => [...prev, emptyRule()]);

  const removeRule = (key) => setRules((prev) => prev.filter((r) => r._key !== key));

  const updateRule = (key, field, value) => {
    setRules((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Structure name is required.";
    rules.forEach((r, i) => {
      if (!r.code.trim()) errs[`rule_${i}_code`] = "Rule code is required.";
      if (!r.label.trim()) errs[`rule_${i}_label`] = "Label is required.";
      if (r.value === "" || isNaN(Number(r.value))) errs[`rule_${i}_value`] = "Numeric value required.";
      if ((r.type === "PERCENTAGE_OF_BASE" || r.type === "PERCENTAGE_DEDUCTION") && !r.baseRuleCode.trim()) {
        errs[`rule_${i}_baseRuleCode`] = "Base rule code is required for % types.";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      name: name.trim(),
      description: description.trim(),
      type: "MONTHLY_FIXED",
      rules: rules.map(({ _key, ...r }) => ({ ...r, value: Number(r.value) })),
    };
    onSubmit(payload);
  };

  const handlePreview = () => {
    if (!sampleWage || isNaN(Number(sampleWage))) return;
    const payload = {
      rules: rules.map(({ _key, ...r }) => ({ ...r, value: Number(r.value) })),
      sampleWage: Number(sampleWage),
    };
    onPreview?.(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Structure Name <span className="text-rose-400">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Software Engineer – Level 2"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60 transition-colors"
          />
          {(errors.name || fieldErrorMap.name) && (
            <p className="text-rose-400 text-xs mt-1">{errors.name || fieldErrorMap.name}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional notes about this structure..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/60 resize-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-blue-300">Structure type is locked to <strong>MONTHLY_FIXED</strong> for Phase 3.</span>
        </div>
      </div>

      {/* Rules Builder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Salary Rules</h3>
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Rule
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((rule, i) => (
            <div key={rule._key} className="p-4 rounded-xl border border-slate-700 bg-slate-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Rule #{i + 1}</span>
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(rule._key)}
                    className="text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Code */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Rule Code <span className="text-rose-400">*</span></label>
                  <input
                    value={rule.code}
                    onChange={(e) => updateRule(rule._key, "code", e.target.value.toUpperCase().replace(/\s/g, "_"))}
                    placeholder="BASIC, HRA, PF..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 font-mono"
                  />
                  {errors[`rule_${i}_code`] && <p className="text-rose-400 text-xs mt-0.5">{errors[`rule_${i}_code`]}</p>}
                </div>

                {/* Label */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Display Label <span className="text-rose-400">*</span></label>
                  <input
                    value={rule.label}
                    onChange={(e) => updateRule(rule._key, "label", e.target.value)}
                    placeholder="Basic Salary, HRA..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
                  />
                  {errors[`rule_${i}_label`] && <p className="text-rose-400 text-xs mt-0.5">{errors[`rule_${i}_label`]}</p>}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select
                    value={rule.type}
                    onChange={(e) => updateRule(rule._key, "type", e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
                  >
                    {RULE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Value <span className="text-rose-400">*</span></label>
                  <input
                    type="number"
                    value={rule.value}
                    onChange={(e) => updateRule(rule._key, "value", e.target.value)}
                    placeholder={rule.type.includes("PERCENTAGE") ? "12.5" : "50000"}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
                  />
                  {errors[`rule_${i}_value`] && <p className="text-rose-400 text-xs mt-0.5">{errors[`rule_${i}_value`]}</p>}
                </div>
              </div>

              {/* Base rule code for percentage types */}
              {(rule.type === "PERCENTAGE_OF_BASE" || rule.type === "PERCENTAGE_DEDUCTION") && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Base Rule Code <span className="text-rose-400">*</span></label>
                  <input
                    value={rule.baseRuleCode}
                    onChange={(e) => updateRule(rule._key, "baseRuleCode", e.target.value.toUpperCase().replace(/\s/g, "_"))}
                    placeholder="BASIC"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50 font-mono"
                  />
                  {errors[`rule_${i}_baseRuleCode`] && <p className="text-rose-400 text-xs mt-0.5">{errors[`rule_${i}_baseRuleCode`]}</p>}
                  <p className="text-xs text-slate-600 mt-0.5">Must reference the Code of another rule in this structure.</p>
                </div>
              )}

              {/* Optional toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.isOptional}
                  onChange={(e) => updateRule(rule._key, "isOptional", e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/30"
                />
                <span className="text-xs text-slate-400">Optional (can be excluded per employee)</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Preview section */}
      {onPreview && (
        <div className="p-4 rounded-xl border border-slate-700 bg-slate-900/40 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Live Calculation Preview</h3>
          <p className="text-xs text-slate-500">Calculations are performed by Mohith&apos;s backend engine — no client-side math.</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={sampleWage}
              onChange={(e) => setSampleWage(e.target.value)}
              placeholder="Sample gross wage (e.g. 60000)"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500/50"
            />
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewLoading || !sampleWage}
              className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs border border-blue-500/30 disabled:opacity-40 transition-colors"
            >
              {isPreviewLoading ? "Computing..." : "Preview"}
            </button>
          </div>

          {previewError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rose-300">{previewError}</p>
            </div>
          )}

          {previewResult && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Gross Earnings", value: previewResult.grossEarnings },
                  { label: "Total Deductions", value: previewResult.totalDeductions },
                  { label: "Net Pay", value: previewResult.netPay, highlight: true },
                ].map((item) => (
                  <div key={item.label} className={`p-2.5 rounded-lg border ${item.highlight ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800 border-slate-700"}`}>
                    <div className="text-[10px] text-slate-500">{item.label}</div>
                    <div className={`text-sm font-bold mt-0.5 ${item.highlight ? "text-emerald-400" : "text-slate-200"}`}>
                      ₹{Number(item.value || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
              {previewResult.items?.length > 0 && (
                <div className="divide-y divide-slate-800 text-xs">
                  {previewResult.items.map((item, i) => (
                    <div key={i} className="flex justify-between py-1.5 text-slate-400">
                      <span>{item.label}</span>
                      <span className={item.type?.includes("DEDUCTION") ? "text-rose-400" : "text-slate-200"}>
                        {item.type?.includes("DEDUCTION") ? "−" : "+"}₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Saving..." : initialData ? "Update Structure" : "Create Structure"}
        </button>
      </div>
    </form>
  );
}
