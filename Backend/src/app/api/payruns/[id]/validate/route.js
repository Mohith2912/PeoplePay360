import { requireAuth, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { validatePayrun } from "@/modules/payroll/payroll.service";
export async function POST(request, { params }) { try { const user = await requireAuth(); if (!isPayrollReader(user.role)) return failure("Payroll access is not allowed for this role", 403); const result = await validatePayrun((await params).id); return success(result, result.valid ? "Payrun validated" : "Payrun has blocking warnings", result.valid ? 200 : 422); } catch (error) { return handleError(error); } }
