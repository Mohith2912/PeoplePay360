import { requireAuth, requireRoles } from "@/lib/auth";
import { handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { pagination, paginationSchema } from "@/lib/pagination";
import { z } from "zod";
import { employeeCreateSchema } from "@/modules/employees/schemas";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const query = paginationSchema.extend({ department: z.string().optional(), search: z.string().optional() }).parse(Object.fromEntries(new URL(request.url).searchParams));
    const where = user.role === "EMPLOYEE" ? { id: user.employee?.id ?? "__none__" } : { ...(query.department ? { department: String(query.department) } : {}), ...(query.search ? { OR: [{ firstName: { contains: String(query.search) } }, { lastName: { contains: String(query.search) } }, { employeeCode: { contains: String(query.search) } }] } : {}) };
    const { skip, take } = pagination(query.page, query.limit);
    const [data, total] = await Promise.all([prisma.employee.findMany({ where, skip, take, include: { manager: { select: { id: true, firstName: true, lastName: true } }, workingSchedule: { include: { days: true } }, _count: { select: { contracts: true, attendanceRecords: true, timeOffRequests: true, allocations: true } } }, orderBy: { createdAt: "desc" } }), prisma.employee.count({ where })]);
    return success(data, "Employees loaded", 200);
  } catch (error) { return handleError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(); requireRoles(user, "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN");
    const input = employeeCreateSchema.parse(await request.json());
    const employee = await prisma.employee.create({ data: input, include: { manager: true, workingSchedule: { include: { days: true } } } });
    return success(employee, "Employee created", 201);
  } catch (error) { return handleError(error); }
}
