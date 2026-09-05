import { requireAuth, isPayrollManager, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ salaryStructureId: z.string().min(1), name: z.string().min(1), code: z.string().regex(/^[A-Z][A-Z0-9_]*$/), category: z.enum(["BASIC", "ALLOWANCE", "GROSS", "DEDUCTION", "NET", "REIMBURSEMENT"]), sequence: z.number().int().nonnegative(), computationType: z.enum(["FIXED", "PERCENTAGE", "FORMULA"]), value: z.union([z.string(), z.number()]).transform(String), baseCode: z.string().optional(), isActive: z.boolean().default(true) });
export async function GET(request) { try {
    const user = await requireAuth();
    if (!isPayrollReader(user.role))
        return failure("Payroll access is not allowed for this role", 403);
    const structureId = new URL(request.url).searchParams.get("salaryStructureId");
    return success(await prisma.salaryRule.findMany({ where: structureId ? { salaryStructureId: structureId } : {}, orderBy: [{ sequence: "asc" }, { code: "asc" }] }));
}
catch (error) {
    return handleError(error);
} }
export async function POST(request) { try {
    const user = await requireAuth();
    if (!isPayrollManager(user.role))
        return failure("Only payroll managers can manage salary rules", 403);
    return success(await prisma.salaryRule.create({ data: schema.parse(await request.json()) }), "Salary rule created", 201);
}
catch (error) {
    return handleError(error);
} }
