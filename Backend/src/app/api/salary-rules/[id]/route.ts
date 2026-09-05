import { requireAuth, isPayrollManager } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1).optional(), sequence: z.number().int().nonnegative().optional(), value: z.union([z.string(), z.number()]).transform(String).optional(), baseCode: z.string().nullable().optional(), isActive: z.boolean().optional() });
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can manage salary rules", 403); return success(await prisma.salaryRule.update({ where: { id: (await params).id }, data: schema.parse(await request.json()) }), "Salary rule updated"); } catch (error) { return handleError(error); } }
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can manage salary rules", 403); await prisma.salaryRule.update({ where: { id: (await params).id }, data: { isActive: false } }); return success(null, "Salary rule archived"); } catch (error) { return handleError(error); } }
