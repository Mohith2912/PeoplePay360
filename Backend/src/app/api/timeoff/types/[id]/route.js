import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ name: z.string().min(2).optional(), unit: z.enum(["DAYS", "HOURS"]).optional(), requiresAllocation: z.boolean().optional(), approvalRequired: z.boolean().optional(), payrollIntegration: z.boolean().optional(), isPaid: z.boolean().optional() });
export async function PUT(request, { params }) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("Only HR can update time-off types", 403); return success(await prisma.timeOffType.update({ where: { id: (await params).id }, data: schema.parse(await request.json()) }), "Time-off type updated"); } catch (error) { return handleError(error); } }
export async function DELETE(request, { params }) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("Only HR can delete time-off types", 403); const id = (await params).id; if (await prisma.timeOffRequest.count({ where: { timeOffTypeId: id } })) return failure("Time-off type is already used", 409); await prisma.timeOffType.delete({ where: { id } }); return success(null, "Time-off type deleted"); } catch (error) { return handleError(error); } }
