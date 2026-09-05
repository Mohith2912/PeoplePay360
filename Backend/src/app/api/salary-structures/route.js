<<<<<<< HEAD
import { requireAuth, isPayrollManager, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const ruleSchema = z.object({ name: z.string().min(1), code: z.string().regex(/^[A-Z][A-Z0-9_]*$/), category: z.enum(["BASIC", "ALLOWANCE", "GROSS", "DEDUCTION", "NET", "REIMBURSEMENT"]), sequence: z.number().int().nonnegative(), computationType: z.enum(["FIXED", "PERCENTAGE", "FORMULA"]), value: z.string(), baseCode: z.string().optional(), isActive: z.boolean().default(true) });
const structureSchema = z.object({ name: z.string().min(2), code: z.string().min(2), description: z.string().optional(), isActive: z.boolean().default(true), salaryRules: z.array(ruleSchema).default([]) });
export async function GET() {
    try {
        const user = await requireAuth();
        if (!isPayrollReader(user.role))
            return failure("Payroll access is not allowed for this role", 403);
        return success(await prisma.salaryStructure.findMany({ include: { salaryRules: { orderBy: { sequence: "asc" } } }, orderBy: { name: "asc" } }));
    }
    catch (error) {
        return handleError(error);
    }
}
export async function POST(request) {
    try {
        const user = await requireAuth();
        if (!isPayrollManager(user.role))
            return failure("Only payroll managers can manage salary structures", 403);
        const input = structureSchema.parse(await request.json());
        const result = await prisma.salaryStructure.create({ data: { name: input.name, code: input.code, description: input.description, isActive: input.isActive, salaryRules: { create: input.salaryRules } }, include: { salaryRules: true } });
        return success(result, "Salary structure created", 201);
    }
    catch (error) {
        return handleError(error);
    }
}
=======
export { structuresGET as GET, structuresPOST as POST } from '@/modules/integration/structures';
export const runtime = 'nodejs';
>>>>>>> origin/master
