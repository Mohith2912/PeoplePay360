import { requireAuth, requireRoles } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { pagination, paginationSchema } from "@/lib/pagination";
import { z } from "zod";
import { employeeCreateSchema } from "@/modules/employees/schemas";
export async function GET(request) {
    try {
        const user = await requireAuth();
        const query = paginationSchema.extend({ department: z.string().optional(), status: z.enum(["ACTIVE", "NOTICE_PERIOD", "TERMINATED"]).optional(), managerId: z.string().optional(), workingScheduleId: z.string().optional(), search: z.string().optional() }).parse(Object.fromEntries(new URL(request.url).searchParams));
        const where = user.role === "EMPLOYEE" ? { id: user.employee?.id ?? "__none__" } : { ...(query.department ? { department: query.department } : {}), ...(query.status ? { status: query.status } : {}), ...(query.managerId ? { managerId: query.managerId } : {}), ...(query.workingScheduleId ? { workingScheduleId: query.workingScheduleId } : {}), ...(query.search ? { OR: [{ firstName: { contains: query.search } }, { lastName: { contains: query.search } }, { employeeCode: { contains: query.search } }, { email: { contains: query.search } }, { designation: { contains: query.search } }] } : {}) };
        const { skip, take } = pagination(query.page, query.limit);
        const [data, total] = await Promise.all([prisma.employee.findMany({ where, skip, take, include: { manager: { select: { id: true, firstName: true, lastName: true } }, workingSchedule: { include: { days: true } }, _count: { select: { contracts: true, attendanceRecords: true, timeOffRequests: true, allocations: true } } }, orderBy: { createdAt: "desc" } }), prisma.employee.count({ where })]);
        return success({ items: data, pagination: { page: query.page, pageSize: query.limit, total, totalPages: Math.ceil(total / query.limit) } }, "Employees loaded", 200);
    }
    catch (error) {
        return handleError(error);
    }
}
export async function POST(request) {
    try {
        const user = await requireAuth();
        requireRoles(user, "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN");
        const input = employeeCreateSchema.parse(await request.json());
        if (input.managerId === undefined ? false : input.managerId === "")
            return failure("managerId is invalid", 400);
        if (input.managerId === undefined || input.managerId === null) { /* no manager */ }
        else {
            if (input.managerId === undefined)
                return failure("managerId is invalid", 400);
            const manager = await prisma.employee.findUnique({ where: { id: input.managerId } });
            if (!manager)
                return failure("Manager not found", 404);
        }
        if (input.workingScheduleId) {
            const schedule = await prisma.workingSchedule.findUnique({ where: { id: input.workingScheduleId } });
            if (!schedule)
                return failure("Working schedule not found", 404);
        }
        const employee = await prisma.employee.create({ data: input, include: { manager: true, workingSchedule: { include: { days: true } } } });
        return success(employee, "Employee created", 201);
    }
    catch (error) {
        return handleError(error);
    }
}
