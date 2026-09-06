import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ periodStart: z.coerce.date().optional(), periodEnd: z.coerce.date().optional(), allocated: z.coerce.number().nonnegative().optional(), status: z.enum(["ACTIVE", "EXPIRED"]).optional() });
export async function PUT(request, { params }) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("Only HR can update allocations", 403); const id = (await params).id; const existing = await prisma.timeOffAllocation.findUnique({ where: { id } }); if (!existing) return failure("Allocation not found", 404); const input = schema.parse(await request.json()); const allocated = input.allocated ?? Number(existing.allocated); if (allocated < Number(existing.taken)) return failure("Allocation cannot be below taken amount", 422); return success(await prisma.timeOffAllocation.update({ where: { id }, data: { ...input, allocated } }), "Allocation updated"); } catch (error) { return handleError(error); } }
