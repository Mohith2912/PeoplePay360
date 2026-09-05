import { BusinessRuleError } from "@/lib/errors";
import { roundMoney } from "@/lib/money";
import { evaluateFormula } from "./formula";
export function evaluateSalaryRules(rules, base) {
    const context = { ...base };
    const result = [];
    for (const rule of rules.filter((item) => item.isActive).sort((a, b) => a.sequence - b.sequence)) {
        let amount;
        if (rule.computationType === "FIXED")
            amount = Number(rule.value);
        else if (rule.computationType === "PERCENTAGE") {
            if (!rule.baseCode || !(rule.baseCode in context))
                throw new BusinessRuleError(`Rule ${rule.code} references an unknown base`);
            amount = context[rule.baseCode] * Number(rule.value) / 100;
        }
        else
            amount = evaluateFormula(rule.value, context);
        if (!Number.isFinite(amount))
            throw new BusinessRuleError(`Rule ${rule.code} produced an invalid amount`);
        amount = roundMoney(amount);
        context[rule.code] = amount;
        result.push({ salaryRuleId: rule.id, name: rule.name, code: rule.code, category: rule.category, sequence: rule.sequence, amount });
    }
    return result;
}
export function summarizeRules(lines) {
    const grossEarnings = roundMoney(lines.filter((line) => ["BASIC", "ALLOWANCE", "GROSS"].includes(line.category)).reduce((sum, line) => sum + line.amount, 0));
    const grossDeductions = roundMoney(lines.filter((line) => line.category === "DEDUCTION").reduce((sum, line) => sum + line.amount, 0));
    const totalReimbursement = roundMoney(lines.filter((line) => line.category === "REIMBURSEMENT").reduce((sum, line) => sum + line.amount, 0));
    return { grossEarnings, grossDeductions, totalReimbursement, netPay: roundMoney(grossEarnings - grossDeductions), netTransfer: roundMoney(grossEarnings - grossDeductions + totalReimbursement) };
}
