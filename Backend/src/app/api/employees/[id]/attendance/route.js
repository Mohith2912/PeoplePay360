<<<<<<< HEAD
import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export async function GET(request, { params }) { try { const user = await requireAuth(); const id = (await params).id; if (!isHr(user.role) && user.employee?.id !== id) return failure("You can only view your own attendance", 403); const q = new URL(request.url).searchParams; return success(await prisma.attendanceRecord.findMany({ where: { employeeId: id, ...(q.get("startDate") || q.get("endDate") ? { date: { ...(q.get("startDate") ? { gte: new Date(q.get("startDate")) } : {}), ...(q.get("endDate") ? { lte: new Date(q.get("endDate")) } : {}) } } : {}) }, orderBy: { date: "desc" } })); } catch (error) { return handleError(error); } }
=======
export { attendanceGET as GET } from '@/modules/integration/operations';
export const runtime = 'nodejs';
>>>>>>> origin/master
