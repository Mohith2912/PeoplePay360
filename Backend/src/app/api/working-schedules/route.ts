import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const daySchema = z.object({ dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]), startTime: z.string().regex(/^\d{2}:\d{2}$/), endTime: z.string().regex(/^\d{2}:\d{2}$/), breakMinutes: z.number().int().min(0).default(0), isWorking: z.boolean().default(true) });
const scheduleSchema = z.object({ name: z.string().min(2), type: z.string().min(1), company: z.string().optional(), days: z.array(daySchema).min(1) });

function weeklyHours(days: z.infer<typeof daySchema>[]) { return days.reduce((total, day) => { if (!day.isWorking) return total; const [startHour, startMinute] = day.startTime.split(":").map(Number); const [endHour, endMinute] = day.endTime.split(":").map(Number); const hours = (endHour * 60 + endMinute - startHour * 60 - startMinute - day.breakMinutes) / 60; if (hours <= 0) throw new Error(`Invalid working hours for ${day.dayOfWeek}`); return total + hours; }, 0); }

export async function GET() { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("HR access is not allowed for this role", 403); return success(await prisma.workingSchedule.findMany({ include: { days: true }, orderBy: { name: "asc" } })); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { const user = await requireAuth(); if (!isHr(user.role)) return failure("HR access is not allowed for this role", 403); const input = scheduleSchema.parse(await request.json()); const result = await prisma.workingSchedule.create({ data: { name: input.name, type: input.type, company: input.company, weeklyHours: weeklyHours(input.days), days: { create: input.days } }, include: { days: true } }); return success(result, "Working schedule created", 201); } catch (error) { return handleError(error); } }
