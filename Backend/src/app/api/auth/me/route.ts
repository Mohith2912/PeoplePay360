import { requireAuth } from "@/lib/auth";
import { handleError, success } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireAuth();
    return success({ id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employee?.id, createdAt: user.createdAt, updatedAt: user.updatedAt });
  } catch (error) { return handleError(error); }
}
