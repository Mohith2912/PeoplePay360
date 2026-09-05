import { prisma } from "@/lib/prisma";
import { hashPassword, requireAuth, requireRoles } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { z } from "zod";

const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8), role: z.enum(["EMPLOYEE", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"]).default("EMPLOYEE"), employeeId: z.string().optional() });

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const count = await prisma.user.count();
    if (count > 0) { const actor = await requireAuth(); requireRoles(actor, "ADMIN"); }
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return failure("Email is already registered", 409);
    const user = await prisma.user.create({ data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: input.role, ...(input.employeeId ? { employee: { connect: { id: input.employeeId } } } : {}) }, select: { id: true, name: true, email: true, role: true, employee: { select: { id: true } }, createdAt: true, updatedAt: true } });
    return success(user, "User registered", 201);
  } catch (error) { return handleError(error); }
}
