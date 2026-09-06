"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Grid3X3, List, Plus, Search, Trash2, Users } from "lucide-react";
import { useEmployeeStore } from "@/store/employeeStore";
import { useAuthStore } from "@/store/authStore";
import { EmployeeForm } from "./EmployeeForm";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { canAccessHR } from "@/lib/permissions";

const variant = { ACTIVE: "success", NOTICE_PERIOD: "warning", TERMINATED: "danger" };
const statuses = ["ACTIVE", "NOTICE_PERIOD", "TERMINATED"];
const EMPLOYEES_PER_PAGE = 25;

export default function UnifiedEmployeeDirectory() {
  const { user } = useAuthStore();
  const store = useEmployeeStore();
  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({ search: "", department: "", status: "" });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(
    (retry = false) => store.fetchEmployees({ ...filters, page, limit: EMPLOYEES_PER_PAGE }, retry),
    [filters, page, store.fetchEmployees],
  );

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const updateFilters = (next) => { setFilters(next); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(store.total / EMPLOYEES_PER_PAGE));

  useEffect(() => {
    if (!store.isLoading && page > totalPages) setPage(totalPages);
  }, [page, store.isLoading, totalPages]);

  async function save(data) {
    await store.createEmployee(data);
    setForm(false);
    setMessage("Employee created successfully.");
    load();
  }

  async function remove(employee) {
    if (!window.confirm(`Remove ${employee.name} from the active workforce? Their payroll and HR history will be preserved.`)) return;
    try {
      await store.removeEmployee(employee.id);
      setMessage(`${employee.name} was removed from the active workforce.`);
    } catch {}
  }

  if (form) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="erp-page-header"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Employee master</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Add employee</h2><p className="mt-1 text-sm text-slate-500">Create a workforce profile and connect employment details.</p></div></header>
        <section className="erp-card rounded-xl p-5 sm:p-7"><EmployeeForm onSubmit={save} onCancel={() => setForm(false)} isLoading={store.isSubmitting} /></section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="erp-page-header">
        <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Workforce directory</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900"><Users className="h-6 w-6 text-blue-700" /> Employee master</h2><p className="mt-1 text-sm text-slate-500">{store.total} employee record{store.total === 1 ? "" : "s"} across the organization.</p></div>
        {canAccessHR(user?.role) && <button type="button" onClick={() => setForm(true)} className="erp-primary-button"><Plus className="h-4 w-4" /> Add employee</button>}
      </header>

      <section className="erp-toolbar">
        <label className="relative min-w-60 flex-1"><span className="sr-only">Search employees</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search employees" placeholder="Search name, code or email" className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm" value={filters.search} onChange={(event) => updateFilters({ ...filters, search: event.target.value })} /></label>
        <input aria-label="Department" placeholder="All departments" className="min-w-44 rounded-lg border px-3 py-2.5 text-sm" value={filters.department} onChange={(event) => updateFilters({ ...filters, department: event.target.value })} />
        <select aria-label="Status" className="min-w-40 rounded-lg border px-3 py-2.5 text-sm" value={filters.status} onChange={(event) => updateFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="View options">
          <button type="button" aria-label="List view" className={`rounded-md p-2 ${view === "list" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`} onClick={() => setView("list")}><List className="h-4 w-4" /></button>
          <button type="button" aria-label="Kanban view" className={`rounded-md p-2 ${view === "kanban" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`} onClick={() => setView("kanban")}><Grid3X3 className="h-4 w-4" /></button>
        </div>
      </section>

      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {store.error && <ErrorState title="Unable to load employees" message={store.error} onRetry={() => load(true)} />}
      {store.isLoading && <div className="erp-card rounded-xl p-8 text-center text-sm text-slate-500">Loading employee records…</div>}
      {!store.isLoading && !store.error && !store.employees.length && <div className="erp-card rounded-xl p-10 text-center"><Users className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No employee records found</p><p className="mt-1 text-sm text-slate-500">Adjust the current search or filters.</p></div>}

      {!store.isLoading && store.employees.length > 0 && view === "kanban" && (
        <div className="space-y-5">
          {statuses.map((status) => {
            const employees = store.employees.filter((employee) => employee.employmentStatus === status);
            return <section key={status} className="rounded-xl border border-slate-200 bg-slate-100/70 p-4"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-700">{status.replace("_", " ")}</h3><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm">{employees.length}</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{employees.map((employee) => <article key={employee.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md"><div className="flex items-start justify-between gap-2"><div><Link className="font-bold text-slate-800 hover:text-blue-700" href={`/employees/${employee.id}`}>{employee.name}</Link><p className="mt-0.5 text-xs text-slate-500">{employee.employeeCode}</p></div><Link aria-label={`View ${employee.name}`} href={`/employees/${employee.id}`}><ChevronRight className="h-4 w-4 text-slate-400" /></Link></div><p className="mt-3 text-sm text-slate-600">{employee.jobPosition}</p><p className="text-xs text-slate-500">{employee.department}</p>{canAccessHR(user?.role)&&<div className="mt-4 border-t border-slate-100 pt-3"><button type="button" disabled={store.removingEmployeeId===employee.id} onClick={()=>remove(employee)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{store.removingEmployeeId===employee.id?'Removing…':'Remove employee'}</button></div>}</article>)}</div></section>;
          })}
        </div>
      )}
      {!store.isLoading && store.total > EMPLOYEES_PER_PAGE && <nav className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3" aria-label="Employee pagination"><p className="text-sm text-slate-500">Page {page} of {totalPages} · maximum {EMPLOYEES_PER_PAGE} employees per page</p><div className="flex gap-2"><button type="button" className="erp-secondary-button" disabled={page===1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Previous</button><button type="button" className="erp-secondary-button" disabled={page>=totalPages} onClick={()=>setPage(value=>Math.min(totalPages,value+1))}>Next</button></div></nav>}

      {!store.isLoading && store.employees.length > 0 && view === "list" && (
        <div className="erp-table-wrap">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead><tr><th className="px-5 py-3.5">Employee</th><th className="px-5 py-3.5">Contact</th><th className="px-5 py-3.5">Role &amp; department</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Profile</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{store.employees.map((employee) => <tr key={employee.id}><td className="px-5 py-4"><Link className="font-bold text-blue-700 hover:text-blue-900" href={`/employees/${employee.id}`}>{employee.name}</Link><p className="mt-0.5 text-xs text-slate-500">{employee.employeeCode}</p></td><td className="px-5 py-4 text-slate-700">{employee.email}<p className="mt-0.5 text-xs text-slate-500">{employee.phone || "No phone provided"}</p></td><td className="px-5 py-4 text-slate-700">{employee.jobPosition}<p className="mt-0.5 text-xs text-slate-500">{employee.department}</p></td><td className="px-5 py-4"><Badge variant={variant[employee.employmentStatus]}>{employee.employmentStatus?.replace("_", " ")}</Badge></td><td className="px-5 py-4 text-right"><Link className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700" href={`/employees/${employee.id}`}>View <ChevronRight className="h-3.5 w-3.5" /></Link></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
