import { requireAuth, requireRoles } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { employeeCreateSchema } from "@/modules/employees/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); const { id } = await params;
    if (user.role === "EMPLOYEE" && user.employee?.id !== id) return failure("You can only view your own employee record", 403);
    const employee = await prisma.employee.findUnique({ where: { id }, include: { manager: true, workingSchedule: { include: { days: true } }, contracts: { include: { salaryStructure: true } }, _count: { select: { contracts: true, attendanceRecords: true, timeOffRequests: true, allocations: true } } } });
    if (!employee) throw new NotFoundError("Employee not found");
    return success(employee);
  } catch (error) { return handleError(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); requireRoles(user, "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN");
    const { id } = await params; const input = employeeCreateSchema.partial().parse(await request.json());
    const employee = await prisma.employee.update({ where: { id }, data: input });
    return success(employee, "Employee updated");
  } catch (error) { return handleError(error); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); requireRoles(user, "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN");
    const { id } = await params;
    await prisma.employee.update({ where: { id }, data: { status: "TERMINATED" } });
    return success(null, "Employee terminated");
  } catch (error) { return handleError(error); }
}
