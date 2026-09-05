<<<<<<< HEAD
import { requireAuth, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { payrunCreateSchema } from "@/modules/payroll/schemas";
export async function GET() {
    try {
        const user = await requireAuth();
        if (!isPayrollReader(user.role))
            return failure("Payroll access is not allowed for this role", 403);
        const data = await prisma.payrun.findMany({ orderBy: { periodStart: "desc" }, include: { salaryStructure: { select: { id: true, name: true, code: true } }, _count: { select: { payslips: true } }, warnings: { where: { isResolved: false } } } });
        return success(data, "Payruns loaded");
    }
    catch (error) {
        return handleError(error);
    }
}
export async function POST(request) {
    try {
        const user = await requireAuth();
        if (!isPayrollReader(user.role))
            return failure("Payroll access is not allowed for this role", 403);
        const input = payrunCreateSchema.parse(await request.json());
        const result = await prisma.$transaction(async (tx) => {
            const structure = await tx.salaryStructure.findUnique({ where: { id: input.salaryStructureId } });
            if (!structure || !structure.isActive)
                throw new NotFoundError("Salary structure not found or inactive");
            const employees = await tx.employee.findMany({ where: { id: { in: input.employeeIds }, status: { not: "TERMINATED" } }, select: { id: true } });
            if (employees.length !== input.employeeIds.length)
                throw new NotFoundError("One or more selected employees were not found");
            const existing = await tx.payrun.findUnique({ where: { name: input.name } });
            if (existing)
                throw new ConflictError("A payrun with this name already exists");
            return tx.payrun.create({ data: { name: input.name, salaryStructureId: input.salaryStructureId, periodStart: input.periodStart, periodEnd: input.periodEnd, createdByUserId: user.id, payslips: { create: input.employeeIds.map((employeeId) => ({ employeeId, periodStart: input.periodStart, periodEnd: input.periodEnd, workedDays: 0 })) } }, include: { payslips: true } });
        });
        return success(result, "Payrun created", 201);
    }
    catch (error) {
        return handleError(error);
    }
}
=======
export { payrunsGET as GET, payrunsPOST as POST } from '@/modules/integration/payroll';
export const runtime = 'nodejs';
>>>>>>> origin/master
