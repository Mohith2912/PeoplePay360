import { requireAuth, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const filterSchema = z.object({ period: z.string().regex(/^\d{4}-\d{2}$/).optional(), department: z.string().optional(), employeeType: z.string().optional() });

export async function GET(request: Request) {
  try {
    const user = await requireAuth(); if (!isPayrollReader(user.role)) return failure("Payroll access is not allowed for this role", 403);
    const filters = filterSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const periodStart = filters.period ? new Date(`${filters.period}-01T00:00:00.000Z`) : undefined;
    const periodEnd = periodStart ? new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0, 23, 59, 59, 999)) : undefined;
    const employeeWhere = { ...(filters.department ? { department: filters.department } : {}), ...(filters.employeeType ? { employeeType: filters.employeeType } : {}) };
    const employees = await prisma.employee.findMany({ where: employeeWhere, select: { id: true, department: true } });
    const employeeIds = employees.map((employee: { id: string }) => employee.id);
    const dateFilter = periodStart && periodEnd ? { gte: periodStart, lte: periodEnd } : undefined;
    const [payslips, attendance, approvedTimeOff, warnings] = await Promise.all([
      prisma.payslip.findMany({ where: { employeeId: { in: employeeIds }, status: "PAID", ...(dateFilter ? { periodStart: dateFilter } : {}) }, select: { employeeId: true, netTransfer: true, netPay: true } }),
      prisma.attendanceRecord.findMany({ where: { employeeId: { in: employeeIds }, ...(dateFilter ? { date: dateFilter } : {}) }, select: { status: true, checkOut: true, isManuallyCorrected: true } }),
      prisma.timeOffRequest.findMany({ where: { employeeId: { in: employeeIds }, status: "APPROVED", ...(dateFilter ? { fromDate: { lte: periodEnd }, toDate: { gte: periodStart } } : {}) }, select: { duration: true } }),
      prisma.payrollWarning.findMany({ where: { isResolved: false, ...(filters.period ? { payrun: { periodStart: dateFilter } } : {}) }, orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    const totalNetSalaryPaid = payslips.reduce((sum: number, item: { netTransfer: unknown }) => sum + Number(item.netTransfer), 0);
    const counts = { present: 0, late: 0, absent: 0, exception: 0 };
    for (const record of attendance) { if (record.status === "PRESENT") counts.present++; else if (record.status === "LATE") counts.late++; else if (record.status === "ABSENT") counts.absent++; else counts.exception++; }
    const totalAttendance = attendance.length;
    const salaryByDepartment = employees.reduce((result: Array<{ department: string; totalSalary: number; headcount: number }>, employee: { id: string; department: string }) => { const amount = payslips.filter((slip: { employeeId: string }) => slip.employeeId === employee.id).reduce((sum: number, slip: { netTransfer: unknown }) => sum + Number(slip.netTransfer), 0); const row = result.find((item) => item.department === employee.department); if (row) row.totalSalary += amount; else result.push({ department: employee.department, totalSalary: amount, headcount: 1 }); return result; }, []);
    return success({ kpis: { totalNetSalaryPaid, payslipsGenerated: payslips.length, averageSalary: payslips.length ? totalNetSalaryPaid / payslips.length : 0, approvedTimeOffDays: approvedTimeOff.reduce((sum: number, item: { duration: unknown }) => sum + Number(item.duration), 0), attendanceHealth: { ...counts, total: totalAttendance, presentPercent: totalAttendance ? counts.present / totalAttendance * 100 : 0, latePercent: totalAttendance ? counts.late / totalAttendance * 100 : 0, absentPercent: totalAttendance ? counts.absent / totalAttendance * 100 : 0 } }, salaryByDepartment, departmentBreakdown: salaryByDepartment, monthlySalaryTrend: [], warnings, attendanceOverview: { present: counts.present, late: counts.late, absent: counts.absent, overtime: 0, missingCheckouts: attendance.filter((record: { checkOut: Date | null }) => !record.checkOut).length, manualEdits: attendance.filter((record: { isManuallyCorrected: boolean }) => record.isManuallyCorrected).length, coveragePercent: employees.length ? totalAttendance / employees.length * 100 : 0 }, pendingTimeOffRequests: 0, expiringContracts: 0 });
  } catch (error) { return handleError(error); }
}
