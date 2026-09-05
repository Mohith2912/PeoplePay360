import { requireAuth, isPayrollManager, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({ name: z.string().min(2).optional(), description: z.string().optional(), isActive: z.boolean().optional() });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireAuth(); if (!isPayrollReader(user.role)) return failure("Payroll access is not allowed for this role", 403); const result = await prisma.salaryStructure.findUnique({ where: { id: (await params).id }, include: { salaryRules: { orderBy: { sequence: "asc" } } } }); return success(result); }
  catch (error) { return handleError(error); }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can manage salary structures", 403); const result = await prisma.salaryStructure.update({ where: { id: (await params).id }, data: updateSchema.parse(await request.json()) }); return success(result, "Salary structure updated"); }
  catch (error) { return handleError(error); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can manage salary structures", 403); await prisma.salaryStructure.update({ where: { id: (await params).id }, data: { isActive: false } }); return success(null, "Salary structure archived"); }
  catch (error) { return handleError(error); }
}
