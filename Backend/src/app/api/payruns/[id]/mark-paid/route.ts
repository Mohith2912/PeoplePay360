import { requireAuth, isPayrollManager } from "@/lib/auth";
import { handleError, success, failure } from "@/lib/api";
import { markPayrunPaid } from "@/modules/payroll/payroll.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); if (!isPayrollManager(user.role)) return failure("Only payroll managers can mark payruns paid", 403);
    const result = await markPayrunPaid((await params).id);
    return success(result, "Payrun marked paid");
  } catch (error) { return handleError(error); }
}
