"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ClipboardList, Pencil, Plus, RefreshCw, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { IntegrationForm } from "@/components/ui/IntegrationForm";
import { ErrorState } from "@/components/ui/ErrorState";

const configs = {
  attendance: { title: "Attendance", description: "Review daily presence, working hours and manual corrections.", endpoint: "/api/attendance", columns: ["employeeName", "date", "checkIn", "checkOut", "workedHours", "status"], fields: [{ name: "employeeId", label: "Employee", source: "employees", required: true }, { name: "date", label: "Date", type: "date", required: true }, { name: "checkIn", label: "Check in (UTC)", type: "datetime-local" }, { name: "checkOut", label: "Check out (UTC)", type: "datetime-local" }, { name: "breakMinutes", label: "Break minutes", type: "number", defaultValue: 0, min: 0 }, { name: "notes", label: "Notes" }] },
  requests: { title: "Time Off Requests", description: "Submit, review and decide employee leave requests.", endpoint: "/api/timeoff/requests", columns: ["employeeName", "typeName", "fromDate", "toDate", "duration", "status"], fields: [{ name: "employeeId", label: "Employee", source: "employees", required: true }, { name: "timeOffTypeId", label: "Leave type", source: "types", required: true }, { name: "fromDate", label: "From", type: "date", required: true }, { name: "toDate", label: "To", type: "date", required: true }, { name: "reason", label: "Reason", required: true }] },
  types: { title: "Time Off Types", description: "Configure leave units, pay treatment and allocation requirements.", endpoint: "/api/timeoff/types", columns: ["name", "code", "unit", "isPaid", "requiresAllocation"], fields: [{ name: "name", label: "Name", required: true }, { name: "code", label: "Code", required: true }, { name: "unit", label: "Unit", options: ["DAYS", "HOURS"], defaultValue: "DAYS", required: true }, { name: "isPaid", label: "Paid leave", options: ["true", "false"], defaultValue: "true" }, { name: "requiresAllocation", label: "Requires allocation", options: ["true", "false"], defaultValue: "true" }] },
  allocations: { title: "Leave Allocations", description: "Manage employee leave entitlements and remaining balances.", endpoint: "/api/timeoff/allocations", columns: ["employeeName", "typeName", "allocatedAmount", "takenAmount", "remainingAmount", "status"], fields: [{ name: "employeeId", label: "Employee", source: "employees", required: true }, { name: "timeOffTypeId", label: "Leave type", source: "types", required: true }, { name: "periodStart", label: "Valid from", type: "date", required: true }, { name: "periodEnd", label: "Valid until", type: "date", required: true }, { name: "allocatedAmount", label: "Days / hours to allocate", type: "number", min: 0, required: true }] },
};

const display = (value) => {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const text = String(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(text) ? text.replace("T", " ").replace(".000Z", "") : text;
};

export default function OperationsPage({ module }) {
  const config = configs[module];
  const { user } = useAuthStore();
  const isHR = user?.role !== "EMPLOYEE";
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const employeeId = new URLSearchParams(window.location.search).get("employeeId") || undefined;
      setRows((await apiClient.get(config.endpoint, { params: { limit: 200, employeeId } })).data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    Promise.all([apiClient.get("/api/employees?limit=200"), apiClient.get("/api/timeoff/types?limit=200")])
      .then(([employees, types]) => setOptions({ employees: employees.data.data.map((item) => ({ value: item.id, label: item.name })), types: types.data.data.map((item) => ({ value: item.id, label: item.name })) }))
      .catch(() => {});
  }, [module]);

  if (!isHR && module === "types") return <div className="erp-card rounded-xl p-8 text-center text-sm text-slate-600">Only HR can manage leave types.</div>;

  const fields = config.fields.filter((field) => isHR || field.name !== "employeeId").map((field) => ({ ...field, ...(field.source ? { options: options[field.source] || [] } : {}) }));
  if (editing?.id && module === "attendance") fields.push({ name: "reason", label: "Reason for correction", required: true });

  async function save(values) {
    setSaving(true);
    try {
      const body = { ...values };
      for (const key of ["isPaid", "requiresAllocation"]) if (key in body) body[key] = body[key] === "true";
      if (!isHR) body.employeeId = user.employeeId;
      for (const key of ["checkIn", "checkOut"]) if (body[key]) body[key] = body[key] + "Z";
      await apiClient[editing.id ? "put" : "post"](config.endpoint + (editing.id ? "/" + editing.id : ""), body);
      setEditing(null);
      setMessage("Saved successfully");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function decide(row, status) {
    setSaving(true);
    try {
      await apiClient.put(config.endpoint + "/" + row.id, { status });
      setMessage("Request " + status.toLowerCase());
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to process request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="erp-page-header">
        <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Workforce operations</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{config.title}</h2><p className="mt-1 text-sm text-slate-500">{config.description}</p></div>
        {(isHR || ["requests", "attendance"].includes(module)) && <button type="button" className="erp-primary-button" onClick={() => setEditing({})}><Plus className="h-4 w-4" /> New record</button>}
      </header>

      {module !== "attendance" && <nav className="erp-toolbar !gap-2" aria-label="Time off sections"><Link className={`rounded-lg px-3 py-2 text-sm font-semibold ${module === "requests" ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50"}`} href="/time-off">Requests</Link>{isHR && <Link className={`rounded-lg px-3 py-2 text-sm font-semibold ${module === "types" ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50"}`} href="/time-off/types">Types</Link>}<Link className={`rounded-lg px-3 py-2 text-sm font-semibold ${module === "allocations" ? "bg-blue-50 text-blue-800" : "text-slate-600 hover:bg-slate-50"}`} href="/time-off/allocations">Allocations &amp; balances</Link></nav>}

      {message && <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><Check className="h-4 w-4" />{message}</p>}
      {editing && <section className="erp-card rounded-xl p-5 sm:p-7"><div className="mb-5"><h3 className="font-bold text-slate-800">{editing.id ? "Update record" : "Create record"}</h3><p className="text-xs text-slate-500">Required fields are marked with an asterisk.</p></div><IntegrationForm key={editing.id || "new"} fields={fields} initialData={Object.fromEntries(Object.entries(editing).map(([key, value]) => [key, typeof value === "string" && value.includes("T") ? value.slice(0, key === "date" ? 10 : 16) : value]))} onSubmit={save} onCancel={() => setEditing(null)} isLoading={saving} /></section>}
      {error && <ErrorState title="Unable to complete request" message={error} onRetry={load} />}

      <section className="erp-table-wrap">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="font-bold text-slate-800">Records</h3><p className="text-xs text-slate-500">{rows.length} item{rows.length === 1 ? "" : "s"} in this view</p></div><button type="button" onClick={load} aria-label="Refresh records" className="erp-secondary-button !min-h-9 !p-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
        <table className="w-full min-w-[760px] text-left text-sm"><thead><tr>{config.columns.map((key) => <th className="px-5 py-3.5" key={key}>{key.replace(/([A-Z])/g, " $1")}</th>)}<th className="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id}>{config.columns.map((key) => <td className="px-5 py-4 text-slate-700" key={key}>{display(row[key])}</td>)}<td className="px-5 py-4 text-right"><div className="flex justify-end gap-2">{isHR && module === "attendance" && <button type="button" onClick={() => setEditing(row)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"><Pencil className="h-3.5 w-3.5" /> Correct</button>}{isHR && module === "requests" && row.status === "PENDING" && <><button type="button" disabled={saving} onClick={() => decide(row, "APPROVED")} className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"><Check className="h-3.5 w-3.5" /> Approve</button><button type="button" disabled={saving} onClick={() => decide(row, "REJECTED")} className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700"><X className="h-3.5 w-3.5" /> Reject</button></>}</div></td></tr>)}</tbody></table>
        {loading && <p className="p-8 text-center text-sm text-slate-500">Loading records…</p>}
        {!loading && !rows.length && <div className="p-10 text-center"><ClipboardList className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No records yet</p><p className="mt-1 text-sm text-slate-500">New records will appear here.</p></div>}
      </section>
    </div>
  );
}
