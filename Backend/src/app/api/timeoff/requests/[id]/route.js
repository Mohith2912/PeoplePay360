<<<<<<< HEAD
import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { BusinessRuleError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const decision = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });
export async function GET(request, { params }) { try { const user = await requireAuth(); const result = await prisma.timeOffRequest.findUnique({ where: { id: (await params).id }, include: { employee: true, timeOffType: true } }); if (!result) return failure("Time-off request not found", 404); if (!isHr(user.role) && result.employeeId !== user.employee?.id) return failure("You can only view your own request", 403); return success(result); } catch (error) { return handleError(error); } }
export async function PUT(request, { params }) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("Only HR can approve time off", 403); const id = (await params).id; const input = decision.parse(await request.json()); const result = await prisma.$transaction(async (tx) => { const item = await tx.timeOffRequest.findUnique({ where: { id }, include: { timeOffType: true } }); if (!item) throw new BusinessRuleError("Time-off request not found"); if (item.status !== "PENDING") throw new BusinessRuleError("Only pending requests can be decided"); if (input.status === "APPROVED" && item.timeOffType.requiresAllocation) { const allocation = await tx.timeOffAllocation.findFirst({ where: { employeeId: item.employeeId, timeOffTypeId: item.timeOffTypeId, periodStart: { lte: item.fromDate }, periodEnd: { gte: item.toDate }, status: "ACTIVE" } }); if (!allocation || Number(allocation.allocated) - Number(allocation.taken) < Number(item.duration)) throw new BusinessRuleError("Insufficient time-off allocation"); await tx.timeOffAllocation.update({ where: { id: allocation.id }, data: { taken: { increment: item.duration } } }); } return tx.timeOffRequest.update({ where: { id }, data: { status: input.status, approvedByUserId: user.id, approvedAt: new Date() } }); }); await audit(user.id, `TIMEOFF_${input.status}`, "TIMEOFF_REQUEST", id); return success(result, `Time-off request ${input.status.toLowerCase()}`); } catch (error) { return handleError(error); } }
=======
export { requestPUT as PUT } from '@/modules/integration/operations';
export const runtime = 'nodejs';
>>>>>>> origin/master
