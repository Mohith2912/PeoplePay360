<<<<<<< HEAD
import { requireAuth, isPayrollManager, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ name: z.string().min(2).optional(), description: z.string().optional(), isActive: z.boolean().optional() });
export async function GET(request, { params }) { try { const user = await requireAuth(); if (!isPayrollReader(user.role)) return failure("Payroll access is not allowed for this role", 403); return success(await prisma.salaryStructure.findUnique({ where: { id: (await params).id }, include: { salaryRules: { orderBy: { sequence: "asc" } } } })); } catch (error) { return handleError(error); } }
export async function PUT(request, { params }) { try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can manage salary structures", 403); return success(await prisma.salaryStructure.update({ where: { id: (await params).id }, data: schema.parse(await request.json()) }), "Salary structure updated"); } catch (error) { return handleError(error); } }
export async function DELETE(request, { params }) { try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can manage salary structures", 403); await prisma.salaryStructure.update({ where: { id: (await params).id }, data: { isActive: false } }); return success(null, "Salary structure archived"); } catch (error) { return handleError(error); } }
=======
export { structureGET as GET, structurePUT as PUT, structureDELETE as DELETE } from '@/modules/integration/structures';
export const runtime = 'nodejs';
>>>>>>> origin/master
