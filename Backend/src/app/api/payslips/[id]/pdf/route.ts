import { requireAuth, isPayrollReader } from "@/lib/auth";
import { failure, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { generatePayslipPdf } from "@/modules/payroll/payslip-pdf.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireAuth(); const id = (await params).id; const payslip = await prisma.payslip.findUnique({ where: { id }, select: { employeeId: true } }); if (!payslip) return failure("Payslip not found", 404); if (!isPayrollReader(user.role) && payslip.employeeId !== user.employee?.id) return failure("You can only download your own payslips", 403); const pdf = await generatePayslipPdf(id); return new Response(Buffer.from(pdf) as unknown as BodyInit, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="payslip-${id}.pdf"` } }); } catch (error) { const response = handleError(error); return response; } }
