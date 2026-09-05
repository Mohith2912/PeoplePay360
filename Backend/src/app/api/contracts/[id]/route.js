<<<<<<< HEAD
import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ employeeId: z.string().min(1), startDate: z.coerce.date(), endDate: z.coerce.date().nullable().optional(), department: z.string().min(1), designation: z.string().min(1), wage: z.coerce.number().positive(), salaryStructureId: z.string().nullable().optional(), status: z.enum(["ACTIVE", "ENDED"]).default("ACTIVE") }).refine((v) => !v.endDate || v.startDate <= v.endDate, { message: "endDate must be after startDate", path: ["endDate"] });
async function overlap(employeeId, startDate, endDate, id) { const result = await prisma.contract.findFirst({ where: { employeeId, id: { not: id }, startDate: { lte: endDate || new Date("9999-12-31") }, OR: [{ endDate: null }, { endDate: { gte: startDate } }] } }); if (result) throw new ConflictError("The employee has an overlapping contract"); }
export async function GET(request, { params }) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("HR access is not allowed for this role", 403); const result = await prisma.contract.findUnique({ where: { id: (await params).id }, include: { employee: true, salaryStructure: true } }); if (!result) throw new NotFoundError("Contract not found"); return success(result); } catch (error) { return handleError(error); } }
export async function PUT(request, { params }) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("HR access is not allowed for this role", 403); const id = (await params).id; const input = schema.parse(await request.json()); await overlap(input.employeeId, input.startDate, input.endDate || null, id); const result = await prisma.contract.update({ where: { id }, data: input, include: { employee: true, salaryStructure: true } }); await audit(user.id, "CONTRACT_UPDATED", "CONTRACT", id); return success(result, "Contract updated"); } catch (error) { return handleError(error); } }
export async function DELETE(request, { params }) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("HR access is not allowed for this role", 403); const id = (await params).id; const result = await prisma.contract.findUnique({ where: { id } }); if (!result) throw new NotFoundError("Contract not found"); await prisma.contract.update({ where: { id }, data: { status: "ENDED", endDate: result.endDate || new Date() } }); await audit(user.id, "CONTRACT_UPDATED", "CONTRACT", id, { action: "ENDED" }); return success(null, "Contract ended"); } catch (error) { return handleError(error); } }
=======
export { contractGET as GET, contractPUT as PUT, contractDELETE as DELETE } from '@/modules/integration/hr';
export const runtime = 'nodejs';
>>>>>>> origin/master
