"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, ChevronLeft, ChevronRight, Grid3X3, List, Plus, Search, Trash2, Users } from "lucide-react";
import { useEmployeeStore } from "@/store/employeeStore";
import { useAuthStore } from "@/store/authStore";
import { EmployeeForm } from "./EmployeeForm";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { canAccessHR } from "@/lib/permissions";

const variant = { ACTIVE: "success", NOTICE_PERIOD: "warning", TERMINATED: "danger" };
const statuses = ["ACTIVE", "NOTICE_PERIOD", "TERMINATED"];
const PAGE_SIZE = 50;
const kanbanStyle = {
  ACTIVE: { dot: "bg-emerald-500", header: "border-emerald-200 bg-emerald-50/80" },
  NOTICE_PERIOD: { dot: "bg-amber-500", header: "border-amber-200 bg-amber-50/80" },
  TERMINATED: { dot: "bg-rose-500", header: "border-rose-200 bg-rose-50/80" },
};

function getInitials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "E";
}

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const items = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("start-ellipsis");
  for (let number = start; number <= end; number += 1) items.push(number);
  if (end < totalPages - 1) items.push("end-ellipsis");
  items.push(totalPages);
  return items;
}

export default function UnifiedEmployeeDirectory() {
  const { user } = useAuthStore();
  const store = useEmployeeStore();
  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({ search: "", department: "", status: "" });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(false);
  const [message, setMessage] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const recordsScrollRef = useRef(null);
  const load = useCallback((retry = false) => store.fetchEmployees({ ...filters, page, limit: PAGE_SIZE }, retry), [filters, page, store.fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const scrollArea = recordsScrollRef.current;
    if (!scrollArea || form) return undefined;

    const handleScroll = () => setShowScrollTop(scrollArea.scrollTop > 40);
    handleScroll();
    scrollArea.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollArea.removeEventListener("scroll", handleScroll);
  }, [form]);

  const updateFilters = (next) => { setFilters(next); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(store.total / PAGE_SIZE));
  const pageItems = getPageItems(page, totalPages);

  function goToPage(nextPage) {
    setPage(nextPage);
    recordsScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    <div className="flex h-[calc(100dvh-6.5rem)] min-h-0 flex-col gap-4 overflow-hidden animate-fade-in sm:h-[calc(100dvh-7.5rem)]">
      <header className="erp-page-header shrink-0">
        <div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Workforce directory</p><h2 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900"><Users className="h-6 w-6 text-blue-700" /> Employee master</h2><p className="mt-1 text-sm text-slate-500">{store.total} employee record{store.total === 1 ? "" : "s"} across the organization.</p></div>
        {canAccessHR(user?.role) && <button type="button" onClick={() => setForm(true)} className="erp-primary-button"><Plus className="h-4 w-4" /> Add employee</button>}
      </header>

      <section className="erp-toolbar shrink-0">
        <label className="relative min-w-60 flex-1"><span className="sr-only">Search employees</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search employees" placeholder="Search name, code or email" className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm" value={filters.search} onChange={(event) => updateFilters({ ...filters, search: event.target.value })} /></label>
        <input aria-label="Department" placeholder="All departments" className="min-w-44 rounded-lg border px-3 py-2.5 text-sm" value={filters.department} onChange={(event) => updateFilters({ ...filters, department: event.target.value })} />
        <select aria-label="Status" className="min-w-40 rounded-lg border px-3 py-2.5 text-sm" value={filters.status} onChange={(event) => updateFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1" aria-label="View options">
          <button type="button" aria-label="List view" className={`rounded-md p-2 ${view === "list" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`} onClick={() => setView("list")}><List className="h-4 w-4" /></button>
          <button type="button" aria-label="Kanban view" className={`rounded-md p-2 ${view === "kanban" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`} onClick={() => setView("kanban")}><Grid3X3 className="h-4 w-4" /></button>
        </div>
      </section>

      <div ref={recordsScrollRef} className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pb-1 pr-1">
      {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {store.error && <ErrorState title="Unable to load employees" message={store.error} onRetry={() => load(true)} />}
      {store.isLoading && <div className="erp-card rounded-xl p-8 text-center text-sm text-slate-500">Loading employee records…</div>}
      {!store.isLoading && !store.error && !store.employees.length && <div className="erp-card rounded-xl p-10 text-center"><Users className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No employee records found</p><p className="mt-1 text-sm text-slate-500">Adjust the current search or filters.</p></div>}

      {!store.isLoading && store.employees.length > 0 && view === "kanban" && (
        <div className="grid items-start gap-4 xl:grid-cols-3">
          {statuses.map((status) => {
            const employees = store.employees.filter((employee) => employee.employmentStatus === status);
            return (
              <section key={status} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100/70 shadow-sm">
                <div className={`flex items-center justify-between border-b px-4 py-3.5 ${kanbanStyle[status].header}`}>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${kanbanStyle[status].dot}`} />{status.replace("_", " ")}</h3>
                  <span className="min-w-7 rounded-full bg-white px-2.5 py-1 text-center text-xs font-bold text-slate-600 shadow-sm">{employees.length}</span>
                </div>
                <div className="space-y-3 p-3">
                  {employees.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-xs font-medium text-slate-500">No employees in this status</div>}
                  {employees.map((employee) => (
                    <article key={employee.id} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">{getInitials(employee.name)}</div>
                        <div className="min-w-0 flex-1"><Link className="block truncate font-bold text-slate-800 transition-colors hover:text-blue-700" href={`/employees/${employee.id}`}>{employee.name}</Link><p className="mt-0.5 text-xs text-slate-500">{employee.employeeCode}</p></div>
                        <Link className="rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700" aria-label={`View ${employee.name}`} href={`/employees/${employee.id}`}><ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></Link>
                      </div>
                      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2.5"><p className="truncate text-sm font-medium text-slate-700">{employee.jobPosition}</p><p className="mt-0.5 truncate text-xs text-slate-500">{employee.department}</p></div>
                      {canAccessHR(user?.role) && <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><Link className="text-xs font-semibold text-blue-700 hover:text-blue-900" href={`/employees/${employee.id}`}>View profile</Link><button type="button" disabled={store.removingEmployeeId === employee.id} onClick={() => remove(employee)} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-800 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" />{store.removingEmployeeId === employee.id ? "Removing…" : "Remove"}</button></div>}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!store.isLoading && store.employees.length > 0 && view === "list" && (
        <div className="erp-table-wrap">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="sticky top-0 z-10"><tr><th className="px-5 py-3.5">Employee</th><th className="px-5 py-3.5">Contact</th><th className="px-5 py-3.5">Role &amp; department</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Profile</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{store.employees.map((employee) => <tr key={employee.id}><td className="px-5 py-4"><Link className="font-bold text-blue-700 hover:text-blue-900" href={`/employees/${employee.id}`}>{employee.name}</Link><p className="mt-0.5 text-xs text-slate-500">{employee.employeeCode}</p></td><td className="px-5 py-4 text-slate-700">{employee.email}<p className="mt-0.5 text-xs text-slate-500">{employee.phone || "No phone provided"}</p></td><td className="px-5 py-4 text-slate-700">{employee.jobPosition}<p className="mt-0.5 text-xs text-slate-500">{employee.department}</p></td><td className="px-5 py-4"><Badge variant={variant[employee.employmentStatus]}>{employee.employmentStatus?.replace("_", " ")}</Badge></td><td className="px-5 py-4 text-right"><Link className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700" href={`/employees/${employee.id}`}>View <ChevronRight className="h-3.5 w-3.5" /></Link></td></tr>)}</tbody>
          </table>
        </div>
      )}

      {!store.isLoading && store.total > PAGE_SIZE && (
        <nav className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between" aria-label="Employee pagination">
          <p className="text-sm text-slate-500">Page <span className="font-semibold text-slate-700">{page}</span> of {totalPages} · {PAGE_SIZE} employees per page</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700" disabled={page === 1} onClick={() => goToPage(Math.max(1, page - 1))}><ChevronLeft className="h-4 w-4" /> Previous</button>
            {pageItems.map((item) => typeof item === "number" ? (
              <button key={item} type="button" aria-label={`Go to page ${item}`} aria-current={page === item ? "page" : undefined} onClick={() => goToPage(item)} className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-bold transition-colors ${page === item ? "border-blue-700 bg-blue-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"}`}>{item}</button>
            ) : <span key={item} className="flex h-10 min-w-8 items-center justify-center text-slate-400" aria-hidden="true">…</span>)}
            <button type="button" className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-700" disabled={page >= totalPages} onClick={() => goToPage(Math.min(totalPages, page + 1))}>Next <ChevronRight className="h-4 w-4" /></button>
          </div>
        </nav>
      )}
      </div>

      <button type="button" aria-label="Back to top" onClick={() => recordsScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg ring-1 ring-blue-800/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${showScrollTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}><ArrowUp className="h-5 w-5" /></button>
    </div>
  );
}
