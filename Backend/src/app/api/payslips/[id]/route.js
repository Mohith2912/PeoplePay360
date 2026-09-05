import { requireAuth, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
export async function GET(request, { params }) { try { const user = await requireAuth(); const result = await prisma.payslip.findUnique({ where: { id: (await params).id }, include: { employee: true, payrun: true, lines: { orderBy: { sequence: "asc" } }, warnings: true } }); if (!result) throw new NotFoundError("Payslip not found"); if (!isPayrollReader(user.role) && result.employeeId !== user.employee?.id) return failure("You can only view your own payslips", 403); return success(result); } catch (error) { return handleError(error); } }
