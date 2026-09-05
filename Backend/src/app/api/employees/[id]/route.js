<<<<<<< HEAD
import { requireAuth, requireRoles } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { employeeCreateSchema } from "@/modules/employees/schemas";

export async function GET(request, { params }) { try { const user = await requireAuth(); const { id } = await params; if (user.role === "EMPLOYEE" && user.employee?.id !== id) return failure("You can only view your own employee record", 403); const employee = await prisma.employee.findUnique({ where: { id }, include: { manager: true, workingSchedule: { include: { days: true } }, contracts: { include: { salaryStructure: true } }, _count: { select: { contracts: true, attendanceRecords: true, timeOffRequests: true, allocations: true } } } }); if (!employee) throw new NotFoundError("Employee not found"); return success(employee); } catch (error) { return handleError(error); } }
export async function PUT(request, { params }) { try { const user = await requireAuth(); requireRoles(user, "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"); const { id } = await params; const input = employeeCreateSchema.partial().parse(await request.json()); if (input.managerId === id) return failure("An employee cannot manage themselves", 400); if (input.managerId && !(await prisma.employee.findUnique({ where: { id: input.managerId } }))) return failure("Manager not found", 404); if (input.workingScheduleId && !(await prisma.workingSchedule.findUnique({ where: { id: input.workingScheduleId } }))) return failure("Working schedule not found", 404); return success(await prisma.employee.update({ where: { id }, data: input }), "Employee updated"); } catch (error) { return handleError(error); } }
export async function DELETE(request, { params }) { try { const user = await requireAuth(); requireRoles(user, "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"); await prisma.employee.update({ where: { id: (await params).id }, data: { status: "TERMINATED" } }); return success(null, "Employee terminated"); } catch (error) { return handleError(error); } }
=======
export { employeeGET as GET, employeePUT as PUT, employeeDELETE as DELETE } from '@/modules/integration/hr';
export const runtime = 'nodejs';
>>>>>>> origin/master
