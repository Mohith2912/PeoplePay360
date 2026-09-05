import puppeteer from "puppeteer";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
function amountInWords(amount) { return `${amount.toFixed(2)} currency units`; }
export async function generatePayslipPdf(id) {
    const payslip = await prisma.payslip.findUnique({ where: { id }, include: { employee: true, payrun: true, lines: { orderBy: { sequence: "asc" } } } });
    if (!payslip)
        throw new NotFoundError("Payslip not found");
    const earnings = payslip.lines.filter((line) => ["BASIC", "ALLOWANCE", "GROSS", "REIMBURSEMENT"].includes(line.category));
    const deductions = payslip.lines.filter((line) => line.category === "DEDUCTION");
    const rows = (lines) => lines.map((line) => `<tr><td>${line.name}</td><td>${Number(line.amount).toFixed(2)}</td></tr>`).join("");
    const html = `<html><body style="font-family:Arial;color:#1f2937;padding:32px"><h1>PeoplePay360</h1><h2>Payslip</h2><p>Period: ${payslip.periodStart.toISOString().slice(0, 10)} to ${payslip.periodEnd.toISOString().slice(0, 10)}</p><p><strong>${payslip.employee.employeeCode}</strong> ${payslip.employee.firstName} ${payslip.employee.lastName}<br/>${payslip.employee.department} · ${payslip.employee.designation}</p><h3>Earnings</h3><table style="width:100%;border-collapse:collapse">${rows(earnings)}</table><h3>Deductions</h3><table style="width:100%;border-collapse:collapse">${rows(deductions)}</table><hr/><p>Gross earnings: ${Number(payslip.grossEarnings).toFixed(2)}</p><p>Gross deductions: ${Number(payslip.grossDeductions).toFixed(2)}</p><h2>Net transfer: ${Number(payslip.netTransfer).toFixed(2)}</h2><p>Amount in words: ${amountInWords(Number(payslip.netTransfer))}</p><small>This is a computer generated document, hence no signature is required.</small></body></html>`;
    const browser = await puppeteer.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load" });
        return await page.pdf({ format: "A4", printBackground: true });
    }
    finally {
        await browser.close();
    }
}
