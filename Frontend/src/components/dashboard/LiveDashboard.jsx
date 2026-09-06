"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Clock3, FileText, IndianRupee, RefreshCw, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function LiveDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ period: "", department: "", employeeType: "" });
  const { user } = useAuthStore();
  const payroll = ["ADMIN", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER"].includes(user?.role);
  const employeePortal = user?.role === "EMPLOYEE";

  async function load() {
    setError("");
    try {
      setData((await apiClient.get("/api/dashboard", { params: filters })).data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load dashboard");
    }
  }

  useEffect(() => {
    load();
  }, [filters.period, filters.department, filters.employeeType]);

  const cards = data ? [
    ...(!employeePortal ? [
      { label: "Total workforce", value: data.kpis.totalWorkforce, detail: "Employees in current scope", icon: Users, tone: "blue" },
      { label: "Present / late", value: `${data.attendanceOverview.present} / ${data.attendanceOverview.late}`, detail: "Attendance status", icon: Clock3, tone: "cyan" },
    ] : []),
    { label: "Pending time off", value: data.pendingTimeOffRequests, detail: "Requests awaiting action", icon: CalendarClock, tone: "amber" },
    { label: "Available leave", value: data.leaveBalance, detail: "Allocated balance", icon: CheckCircle2, tone: "emerald" },
    ...(payroll ? [
      { label: "Net salary paid", value: formatMoney(data.kpis.totalNetSalaryPaid), detail: "For selected filters", icon: IndianRupee, tone: "blue" },
      { label: "Payslips generated", value: data.kpis.payslipsGenerated, detail: "Paid payroll records", icon: FileText, tone: "cyan" },
      { label: "Average salary", value: formatMoney(data.kpis.averageSalary), detail: "Across generated payslips", icon: IndianRupee, tone: "emerald" },
    ] : []),
  ] : [];

  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  const attendanceData = data ? [
    { name: "Present", value: data.attendanceOverview.present, color: "#16a34a" },
    { name: "Late", value: data.attendanceOverview.late, color: "#d97706" },
    { name: "Absent", value: data.attendanceOverview.absent, color: "#dc2626" },
    { name: "Exception", value: data.attendanceOverview.exceptions, color: "#2563eb" },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="erp-page-header">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-blue-700">Operations overview</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user?.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor workforce activity and payroll performance from live records.</p>
        </div>
        <button type="button" onClick={load} className="erp-secondary-button flex items-center gap-2 text-sm"><RefreshCw className="h-4 w-4" /> Refresh data</button>
      </section>

      <section className="erp-toolbar" aria-label="Dashboard filters">
        <label className="min-w-40 flex-1 text-xs font-semibold text-slate-600">Period<input aria-label="Period" type="month" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm" value={filters.period} onChange={(event) => setFilters({ ...filters, period: event.target.value })} /></label>
        <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">Department<input aria-label="Department" placeholder="All departments" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm" value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })} /></label>
        <label className="min-w-48 flex-1 text-xs font-semibold text-slate-600">Employee type<select aria-label="Employee type" className="mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm" value={filters.employeeType} onChange={(event) => setFilters({ ...filters, employeeType: event.target.value })}><option value="">All employee types</option>{["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"].map((type) => <option key={type}>{type}</option>)}</select></label>
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {!data && !error && <div className="erp-card rounded-xl p-8 text-center text-sm text-slate-500">Loading live operational data…</div>}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, detail, icon: Icon, tone }) => (
              <article className="erp-card rounded-xl p-5" key={label}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p></div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
                </div>
                <p className="mt-3 text-xs text-slate-400">{detail}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="erp-card rounded-xl p-5"><h3 className="font-bold text-slate-800">{employeePortal ? "My attendance activity" : "Employee attendance analysis"}</h3><p className="text-xs text-slate-500">Calculated from live attendance records for the selected period</p><div className="mt-4 h-64">{attendanceData.some(item=>item.value>0)?<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={attendanceData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>{attendanceData.map(item=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip /></PieChart></ResponsiveContainer>:<div className="flex h-full items-center justify-center text-sm text-slate-500">No attendance records for this period.</div>}</div></article>
            <article className="erp-card rounded-xl p-5"><h3 className="font-bold text-slate-800">Attendance breakdown</h3><p className="text-xs text-slate-500">Status totals and operational quality</p><div className="mt-5 grid grid-cols-2 gap-3">{attendanceData.map(item=><div key={item.name} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:item.color}}/><p className="text-xs font-semibold text-slate-500">{item.name}</p></div><p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p></div>)}</div><div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs"><div className="rounded-lg bg-slate-50 p-3"><strong className="block text-base text-slate-800">{data.attendanceOverview.coveragePercent}%</strong>Coverage</div><div className="rounded-lg bg-slate-50 p-3"><strong className="block text-base text-slate-800">{data.attendanceOverview.missingCheckouts}</strong>Missing checkout</div><div className="rounded-lg bg-slate-50 p-3"><strong className="block text-base text-slate-800">{data.attendanceOverview.manualEdits}</strong>Corrections</div></div></article>
          </section>

          {payroll && (
            <section className="grid gap-5 xl:grid-cols-2">
              <article className="erp-card rounded-xl p-5">
                <div className="mb-5"><h3 className="font-bold text-slate-800">Salary cost by department</h3><p className="text-xs text-slate-500">Net payroll expenditure for the selected scope</p></div>
                <ResponsiveContainer width="100%" height={270}><BarChart data={data.salaryByDepartment}><CartesianGrid stroke="#e7edf4" vertical={false} /><XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: "1px solid #dce5ef", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }} /><Bar dataKey="salary" fill="#2768ba" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
              </article>
              <article className="erp-card rounded-xl p-5">
                <div className="mb-5"><h3 className="font-bold text-slate-800">Monthly net salary</h3><p className="text-xs text-slate-500">Historical paid payroll trend</p></div>
                <ResponsiveContainer width="100%" height={270}><LineChart data={data.monthlySalaryTrend}><CartesianGrid stroke="#e7edf4" vertical={false} /><XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: "1px solid #dce5ef", borderRadius: 10, boxShadow: "0 8px 24px rgba(15,23,42,.08)" }} /><Line dataKey="netSalary" stroke="#174ea6" strokeWidth={3} dot={{ fill: "#174ea6", r: 4 }} /></LineChart></ResponsiveContainer>
              </article>
            </section>
          )}

          <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="erp-card rounded-xl overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4"><h3 className="font-bold text-slate-800">Recent payroll activity</h3><p className="text-xs text-slate-500">Latest payruns from the live system</p></div>
              {payroll && data.recentPayruns?.length ? <div className="divide-y divide-slate-100">{data.recentPayruns.map((run) => <Link key={run.id} href={`/payroll/payruns/${run.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-blue-50/60"><div><p className="text-sm font-semibold text-slate-800">{run.name}</p><p className="text-xs text-slate-500">{String(run.periodStart).slice(0, 10)} – {String(run.periodEnd).slice(0, 10)}</p></div><span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[0.68rem] font-bold text-blue-700">{run.status}</span></Link>)}</div> : <p className="px-5 py-8 text-center text-sm text-slate-500">No recent payroll activity for this view.</p>}
            </article>

            <article className="erp-card rounded-xl p-5">
              <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h3 className="font-bold text-slate-800">Attention needed</h3></div>
              <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{data.attendanceOverview.missingCheckouts}</p><p className="text-xs text-slate-500">Missing checkouts</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xl font-bold text-slate-900">{data.attendanceOverview.manualEdits}</p><p className="text-xs text-slate-500">Corrected records</p></div></div>
              <div className="mt-4 space-y-2">{data.warnings?.map((warning) => <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800" key={warning.id}>{warning.message}</p>)}</div>
            </article>
          </section>

          <nav className="flex flex-wrap gap-3" aria-label="Quick actions">
            <Link className="erp-secondary-button text-sm" href="/attendance">Review attendance</Link>
            <Link className="erp-secondary-button text-sm" href="/time-off">Time off requests</Link>
            {payroll && <Link className="erp-primary-button text-sm" href="/payroll/payruns">Manage payruns</Link>}
          </nav>
        </>
      )}
    </div>
  );
}
