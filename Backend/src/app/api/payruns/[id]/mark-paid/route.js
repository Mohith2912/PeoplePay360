<<<<<<< HEAD
import { requireAuth, isPayrollManager } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { markPayrunPaid } from "@/modules/payroll/payroll.service";
export async function POST(request, { params }) { try { const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can mark payruns paid", 403); return success(await markPayrunPaid((await params).id), "Payrun marked paid"); } catch (error) { return handleError(error); } }
=======
export { payPOST as POST } from '@/modules/integration/payroll';
export const runtime = 'nodejs';
>>>>>>> origin/master
