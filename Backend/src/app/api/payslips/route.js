import { requireAuth, isPayrollReader } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { prisma } from "@/lib/prisma";
export async function GET(request) {
    try {
        const user = await requireAuth();
        if (!isPayrollReader(user.role)) {
            if (!user.employee)
                return failure("Employee account is not linked to an employee record", 403);
            const data = await prisma.payslip.findMany({ where: { employeeId: user.employee.id }, include: { lines: true, payrun: true }, orderBy: { periodStart: "desc" } });
            return success(data);
        }
        const params = new URL(request.url).searchParams;
        const data = await prisma.payslip.findMany({ where: { ...(params.get("payrunId") ? { payrunId: params.get("payrunId") } : {}), ...(params.get("employeeId") ? { employeeId: params.get("employeeId") } : {}) }, include: { lines: true, employee: true, payrun: true }, orderBy: { periodStart: "desc" } });
        return success(data);
    }
    catch (error) {
        return handleError(error);
    }
}
