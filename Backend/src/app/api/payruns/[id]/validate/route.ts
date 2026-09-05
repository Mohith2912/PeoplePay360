import { requireAuth, isPayrollReader } from "@/lib/auth";
import { handleError, success, failure } from "@/lib/api";
import { validatePayrun } from "@/modules/payroll/payroll.service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(); if (!isPayrollReader(user.role)) return failure("Payroll access is not allowed for this role", 403);
    const result = await validatePayrun((await params).id);
    return success(result, result.valid ? "Payrun validated" : "Payrun has blocking warnings", result.valid ? 200 : 422);
  } catch (error) { return handleError(error); }
}
