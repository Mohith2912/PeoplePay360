import { requireAuth, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { computePayrun } from "@/modules/payroll/payroll.service";
export async function POST(request, { params }) { try { const user = await requireAuth(); if (!isPayrollReader(user.role)) return failure("Payroll access is not allowed for this role", 403); return success(await computePayrun((await params).id), "Payrun computed"); } catch (error) { return handleError(error); } }
