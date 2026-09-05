import { requireAuth, isHr } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export async function GET(request, { params }) { try { const user = await requireAuth(); const id = (await params).id; if (!isHr(user.role) && user.employee?.id !== id) return failure("You can only view your own contracts", 403); return success(await prisma.contract.findMany({ where: { employeeId: id }, include: { salaryStructure: true }, orderBy: { startDate: "desc" } })); } catch (error) { return handleError(error); } }
