import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { ConflictError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const attendanceSchema = z.object({ employeeId: z.string().min(1), date: z.coerce.date(), checkIn: z.coerce.date().nullable().optional(), checkOut: z.coerce.date().nullable().optional(), notes: z.string().optional() }).refine((value) => !value.checkIn || !value.checkOut || value.checkIn <= value.checkOut, { message: "checkOut must be after checkIn", path: ["checkOut"] });
const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
function minutes(value: string) { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; }

async function calculate(input: z.infer<typeof attendanceSchema>) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId }, include: { workingSchedule: { include: { days: true } } } });
  if (!employee) throw new Error("Employee not found");
  const scheduleDay = employee.workingSchedule?.days.find((day) => day.dayOfWeek === dayNames[input.date.getUTCDay()]);
  const workedHours = input.checkIn && input.checkOut ? Math.max(0, (input.checkOut.getTime() - input.checkIn.getTime()) / 3600000 - (scheduleDay?.breakMinutes ?? 0) / 60) : null;
  const status: "PRESENT" | "LATE" | "EXCEPTION" = !input.checkIn || !input.checkOut ? "EXCEPTION" : scheduleDay && input.checkIn.getUTCHours() * 60 + input.checkIn.getUTCMinutes() > minutes(scheduleDay.startTime) ? "LATE" : "PRESENT";
  return { employee, workedHours, status };
}

export async function GET(request: Request) { try { const user = await requireAuth(); const employeeId = new URL(request.url).searchParams.get("employeeId"); if (!isHr(user.role) && employeeId !== user.employee?.id) return failure("You can only view your own attendance", 403); const data = await prisma.attendanceRecord.findMany({ where: employeeId ? { employeeId } : {}, include: { employee: true }, orderBy: { date: "desc" } }); return success(data); } catch (error) { return handleError(error); } }
export async function POST(request: Request) { try { const user = await requireAuth(); const input = attendanceSchema.parse(await request.json()); if (!isHr(user.role) && input.employeeId !== user.employee?.id) return failure("You can only create your own attendance", 403); const calculated = await calculate(input); const existing = await prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId: input.employeeId, date: input.date } } }); if (existing) throw new ConflictError("Attendance already exists for this date"); const result = await prisma.attendanceRecord.create({ data: { employeeId: input.employeeId, date: input.date, checkIn: input.checkIn, checkOut: input.checkOut, workedHours: calculated.workedHours, breakMinutes: calculated.employee.workingSchedule?.days.find((day) => day.dayOfWeek === dayNames[input.date.getUTCDay()])?.breakMinutes, status: calculated.status, notes: input.notes } }); await audit(user.id, "ATTENDANCE_CREATED", "ATTENDANCE", result.id); return success(result, "Attendance recorded", 201); } catch (error) { return handleError(error); } }
