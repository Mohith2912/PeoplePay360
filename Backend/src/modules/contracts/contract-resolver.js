import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
export async function resolvePayrollContract(employeeId, periodStart, periodEnd) {
    const contracts = await prisma.contract.findMany({
        where: { employeeId, startDate: { lte: periodEnd }, OR: [{ endDate: null }, { endDate: { gte: periodStart } }] },
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    });
    if (contracts.length === 0)
        throw new NotFoundError("No contract applies to this payroll period");
    if (contracts.length > 1)
        throw new ConflictError("Multiple contracts apply to this payroll period");
    return contracts[0];
}
