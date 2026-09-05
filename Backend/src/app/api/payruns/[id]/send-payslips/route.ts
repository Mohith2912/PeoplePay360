import { requireAuth, isPayrollManager } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { sendPayrunPayslips } from "@/modules/payroll/email.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can send payslips", 403); return success(await sendPayrunPayslips((await params).id), "Payslip delivery completed"); } catch (error) { return handleError(error); } }
