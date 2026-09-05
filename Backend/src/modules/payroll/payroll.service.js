import { prisma } from "@/lib/prisma";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";
import { decimal } from "@/lib/money";
import { evaluateSalaryRules, summarizeRules } from "./salary-rule-engine";
function resolveContract(contracts, start, end) {
    const matches = contracts.filter((contract) => contract.startDate <= end && (contract.endDate === null || contract.endDate >= start));
    if (matches.length === 0)
        throw new BusinessRuleError("No active contract exists for this payroll period");
    if (matches.length > 1)
        throw new ConflictError("Overlapping active contracts exist for this payroll period");
    return matches[0];
}
export async function computePayrun(payrunId) {
    return prisma.$transaction(async (tx) => {
        const payrun = await tx.payrun.findUnique({ where: { id: payrunId }, include: { salaryStructure: { include: { salaryRules: true } } } });
        if (!payrun)
            throw new NotFoundError("Payrun not found");
        if (payrun.status === "PAID")
            throw new BusinessRuleError("Paid payruns cannot be recomputed");
        const employees = await tx.employee.findMany({ where: { payslips: { some: { payrunId } } }, include: { contracts: true, attendanceRecords: { where: { date: { gte: payrun.periodStart, lte: payrun.periodEnd } } } } });
        if (employees.length === 0)
            throw new BusinessRuleError("No employees are attached to this payrun");
        for (const employee of employees) {
            const contract = resolveContract(employee.contracts, payrun.periodStart, payrun.periodEnd);
            if (contract.salaryStructureId && contract.salaryStructureId !== payrun.salaryStructureId)
                throw new BusinessRuleError(`Employee ${employee.employeeCode} is assigned to a different salary structure`);
            const workedDays = employee.attendanceRecords.filter((record) => ["PRESENT", "LATE"].includes(record.status)).length;
            const lines = evaluateSalaryRules(payrun.salaryStructure.salaryRules, { wage: Number(contract.wage), workedDays, payableDays: workedDays, unpaidLeaveDays: 0 });
            const totals = summarizeRules(lines);
            const existing = await tx.payslip.findUnique({ where: { payrunId_employeeId: { payrunId, employeeId: employee.id } } });
            const values = { periodStart: payrun.periodStart, periodEnd: payrun.periodEnd, workedDays: decimal(workedDays), status: "COMPUTED", grossEarnings: decimal(totals.grossEarnings), grossDeductions: decimal(totals.grossDeductions), netPay: decimal(totals.netPay), totalReimbursement: decimal(totals.totalReimbursement), netTransfer: decimal(totals.netTransfer) };
            const payslip = existing ? await tx.payslip.update({ where: { id: existing.id }, data: values }) : await tx.payslip.create({ data: { payrunId, employeeId: employee.id, ...values } });
            await tx.payslipLine.deleteMany({ where: { payslipId: payslip.id } });
            await tx.payslipLine.createMany({ data: lines.map((line) => ({ payslipId: payslip.id, salaryRuleId: line.salaryRuleId, name: line.name, code: line.code, category: line.category, amount: decimal(line.amount), sequence: line.sequence })) });
        }
        return tx.payrun.update({ where: { id: payrunId }, data: { status: "COMPUTED" }, include: { payslips: { include: { lines: true, employee: true } } } });
    });
}
export async function validatePayrun(payrunId) {
    const payrun = await prisma.payrun.findUnique({ where: { id: payrunId }, include: { payslips: { include: { employee: true } } } });
    if (!payrun)
        throw new NotFoundError("Payrun not found");
    const warnings = [];
    for (const payslip of payrun.payslips) {
        const employee = payslip.employee;
        if (!employee.bankAccountNumber || !employee.ifscCode)
            warnings.push({ type: "MISSING_BANK_DETAILS", message: `Missing bank details for ${employee.employeeCode}`, employeeId: employee.id, payslipId: payslip.id });
        if (!employee.panNumber)
            warnings.push({ type: "MISSING_PAN", message: `Missing PAN for ${employee.employeeCode}`, employeeId: employee.id, payslipId: payslip.id });
        const contracts = await prisma.contract.findMany({ where: { employeeId: employee.id } });
        try {
            resolveContract(contracts, payrun.periodStart, payrun.periodEnd);
        }
        catch (error) {
            warnings.push({ type: error instanceof ConflictError ? "OVERLAPPING_CONTRACT" : "NO_ACTIVE_CONTRACT", message: error instanceof Error ? error.message : "Invalid contract", employeeId: employee.id, payslipId: payslip.id });
        }
    }
    await prisma.$transaction([prisma.payrollWarning.deleteMany({ where: { payrunId } }), ...warnings.map((warning) => prisma.payrollWarning.create({ data: { payrunId, payslipId: warning.payslipId, employeeId: warning.employeeId, entityType: "PAYRUN", entityId: payrunId, warningType: warning.type, message: warning.message } }))]);
    if (warnings.length > 0)
        return { valid: false, warnings };
    await prisma.payrun.update({ where: { id: payrunId }, data: { status: "VALIDATED", payslips: { updateMany: { where: {}, data: { status: "VALIDATED" } } } } });
    return { valid: true, warnings: [] };
}
export async function markPayrunPaid(payrunId) {
    const payrun = await prisma.payrun.findUnique({ where: { id: payrunId } });
    if (!payrun)
        throw new NotFoundError("Payrun not found");
    if (payrun.status !== "VALIDATED")
        throw new BusinessRuleError("Only validated payruns can be marked paid");
    return prisma.payrun.update({ where: { id: payrunId }, data: { status: "PAID", payslips: { updateMany: { where: {}, data: { status: "PAID" } } } }, include: { payslips: true } });
}
