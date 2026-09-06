"use client";

import { useState } from "react";

// Presentation enhanced; field names, values, validation, and submit payload remain unchanged.
export function IntegrationForm({ fields, initialData = {}, onSubmit, onCancel, onValuesChange, isLoading = false, submitLabel = "Save" }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.name, initialData[field.name] ?? field.defaultValue ?? ""])));
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit(values);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Unable to save");
    }
  };

  return (
    <form className="space-y-6" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.name} className="block text-sm font-semibold text-slate-700">
            <span>{field.label}</span>{field.required && <span className="ml-1 text-rose-600" aria-hidden="true">*</span>}
            {field.options ? (
              <select
                name={field.name}
                className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm"
                required={field.required}
                value={values[field.name]}
                onChange={(event) => { const next={ ...values, [field.name]: event.target.value }; setValues(next); onValuesChange?.(next); }}
              >
                <option value="">Select…</option>
                {field.options.map((option) => <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>)}
              </select>
            ) : (
              <input
                name={field.name}
                className="mt-2 w-full rounded-lg border px-3 py-2.5 text-sm"
                required={field.required}
                type={field.type || "text"}
                min={field.min}
                step={field.type === "number" ? "any" : undefined}
                value={values[field.name]}
                onChange={(event) => { const next={ ...values, [field.name]: event.target.value }; setValues(next); onValuesChange?.(next); }}
              />
            )}
            {field.helper && <span className="mt-1.5 block text-xs font-normal text-slate-500">{field.helper}</span>}
          </label>
        ))}
      </div>
      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
        {onCancel && <button type="button" onClick={onCancel} className="erp-secondary-button">Cancel</button>}
        <button type="submit" disabled={isLoading} className="erp-primary-button min-w-28 disabled:opacity-50">{isLoading ? "Saving…" : submitLabel}</button>
      </div>
    </form>
  );
}
