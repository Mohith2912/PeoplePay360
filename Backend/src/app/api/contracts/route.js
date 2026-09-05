import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { ConflictError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const contractSchema = z.object({ employeeId: z.string().min(1), startDate: z.coerce.date(), endDate: z.coerce.date().nullable().optional(), department: z.string().min(1), designation: z.string().min(1), wage: z.coerce.number().positive(), salaryStructureId: z.string().nullable().optional(), status: z.enum(["ACTIVE", "ENDED"]).default("ACTIVE") }).refine((value) => !value.endDate || value.startDate <= value.endDate, { message: "endDate must be after startDate", path: ["endDate"] });
export async function GET(request) {
    try {
        const user = await requireAuth();
        if (!isHr(user.role))
            return failure("HR access is not allowed for this role", 403);
        const employeeId = new URL(request.url).searchParams.get("employeeId");
        const data = await prisma.contract.findMany({ where: employeeId ? { employeeId } : {}, include: { employee: true, salaryStructure: true }, orderBy: { startDate: "desc" } });
        return success(data);
    }
    catch (error) {
        return handleError(error);
    }
}
export async function POST(request) {
    try {
        const user = await requireAuth();
        if (!isHr(user.role))
            return failure("HR access is not allowed for this role", 403);
        const input = contractSchema.parse(await request.json());
        const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
        if (!employee)
            return failure("Employee not found", 404);
        if (input.salaryStructureId) {
            const structure = await prisma.salaryStructure.findUnique({ where: { id: input.salaryStructureId } });
            if (!structure)
                return failure("Salary structure not found", 404);
        }
        const overlap = await prisma.contract.findFirst({ where: { employeeId: input.employeeId, startDate: { lte: input.endDate ?? new Date("9999-12-31") }, OR: [{ endDate: null }, { endDate: { gte: input.startDate } }] } });
        if (overlap)
            throw new ConflictError("The employee already has an overlapping contract");
        const result = await prisma.contract.create({ data: input, include: { employee: true, salaryStructure: true } });
        await audit(user.id, "CONTRACT_CREATED", "CONTRACT", result.id);
        return success(result, "Contract created", 201);
    }
    catch (error) {
        return handleError(error);
    }
}
