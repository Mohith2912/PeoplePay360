import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { BusinessRuleError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({ employeeId: z.string().min(1), timeOffTypeId: z.string().min(1), fromDate: z.coerce.date(), toDate: z.coerce.date(), duration: z.coerce.number().positive(), reason: z.string().optional() }).refine((value) => value.fromDate <= value.toDate, { message: "toDate must be after fromDate", path: ["toDate"] });

export async function GET(request: Request) { try { const user = await requireAuth(); const employeeId = new URL(request.url).searchParams.get("employeeId"); if (!isHr(user.role) && employeeId !== user.employee?.id) return failure("You can only view your own requests", 403); return success(await prisma.timeOffRequest.findMany({ where: employeeId ? { employeeId } : {}, include: { employee: true, timeOffType: true }, orderBy: { createdAt: "desc" } })); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { const user = await requireAuth(); const input = requestSchema.parse(await request.json()); if (!isHr(user.role) && input.employeeId !== user.employee?.id) return failure("You can only create your own requests", 403); const type = await prisma.timeOffType.findUnique({ where: { id: input.timeOffTypeId } }); if (!type) throw new BusinessRuleError("Time-off type not found"); const overlapping = await prisma.timeOffRequest.findFirst({ where: { employeeId: input.employeeId, status: { in: ["PENDING", "APPROVED"] }, fromDate: { lte: input.toDate }, toDate: { gte: input.fromDate } } }); if (overlapping) throw new BusinessRuleError("This request overlaps another active request"); const result = await prisma.timeOffRequest.create({ data: { ...input, status: type.approvalRequired ? "PENDING" : "APPROVED", ...(type.approvalRequired ? {} : { approvedAt: new Date(), approvedByUserId: user.id }) }, include: { timeOffType: true } }); return success(result, "Time-off request submitted", 201); } catch (error) { return handleError(error); } }
