import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(2), code: z.string().min(2), unit: z.enum(["DAYS", "HOURS"]), requiresAllocation: z.boolean().default(true), approvalRequired: z.boolean().default(true), payrollIntegration: z.boolean().default(false), isPaid: z.boolean().default(true) });
export async function GET() { try { await requireAuth(); return success(await prisma.timeOffType.findMany({ orderBy: { name: "asc" } })); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("HR access is not allowed for this role", 403); return success(await prisma.timeOffType.create({ data: schema.parse(await request.json()) }), "Time-off type created", 201); } catch (error) { return handleError(error); } }
