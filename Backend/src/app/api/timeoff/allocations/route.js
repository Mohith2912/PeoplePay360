import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
const schema = z.object({ employeeId: z.string().min(1), timeOffTypeId: z.string().min(1), periodStart: z.coerce.date(), periodEnd: z.coerce.date(), allocated: z.coerce.number().nonnegative(), status: z.enum(["ACTIVE", "EXPIRED"]).default("ACTIVE") }).refine((value) => value.periodStart <= value.periodEnd, { message: "periodEnd must be after periodStart", path: ["periodEnd"] });
export async function GET(request) { try {
    const user = await requireAuth();
    const employeeId = new URL(request.url).searchParams.get("employeeId");
    if (!isHr(user.role) && employeeId !== user.employee?.id)
        return failure("You can only view your own allocations", 403);
    return success(await prisma.timeOffAllocation.findMany({ where: employeeId ? { employeeId } : {}, include: { employee: true, timeOffType: true }, orderBy: { periodStart: "desc" } }));
}
catch (error) {
    return handleError(error);
} }
export async function POST(request) { try {
    const user = await requireAuth();
    if (!isHr(user.role))
        return failure("Only HR can create allocations", 403);
    const input = schema.parse(await request.json());
    const result = await prisma.timeOffAllocation.create({ data: input, include: { employee: true, timeOffType: true } });
    return success(result, "Allocation created", 201);
}
catch (error) {
    return handleError(error);
} }
