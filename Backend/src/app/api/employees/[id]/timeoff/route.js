<<<<<<< HEAD
import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export async function GET(request, { params }) { try { const user = await requireAuth(); const id = (await params).id; if (!isHr(user.role) && user.employee?.id !== id) return failure("You can only view your own time off", 403); return success(await prisma.timeOffRequest.findMany({ where: { employeeId: id }, include: { timeOffType: true }, orderBy: { fromDate: "desc" } })); } catch (error) { return handleError(error); } }
=======
export { requestsGET as GET } from '@/modules/integration/operations';
export const runtime = 'nodejs';
>>>>>>> origin/master
