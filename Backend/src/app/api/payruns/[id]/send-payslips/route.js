<<<<<<< HEAD
import { requireAuth, isPayrollManager } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { sendPayrunPayslips } from "@/modules/payroll/email.service";
export async function POST(request, { params }) { try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can send payslips", 403); return success(await sendPayrunPayslips((await params).id), "Payslip delivery completed"); } catch (error) { return handleError(error); } }
=======
export {bulkEmailPOST as POST} from '@/modules/integration/documents';
export const runtime='nodejs';
>>>>>>> origin/master
