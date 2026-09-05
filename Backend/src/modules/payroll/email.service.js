import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { generatePayslipPdf } from "./payslip-pdf.service";
export async function sendPayrunPayslips(payrunId) {
    const payslips = await prisma.payslip.findMany({ where: { payrunId }, include: { employee: true, payrun: true } });
    const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587), secure: Number(process.env.SMTP_PORT) === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
    const sent = [];
    const failed = [];
    for (const payslip of payslips) {
        try {
            const pdf = await generatePayslipPdf(payslip.id);
            await transporter.sendMail({ from: process.env.SMTP_FROM, to: payslip.employee.email, subject: `Payslip for ${payslip.periodStart.toISOString().slice(0, 7)}`, text: `Hello ${payslip.employee.firstName},\n\nPlease find your payslip attached.`, attachments: [{ filename: `payslip-${payslip.employee.employeeCode}.pdf`, content: Buffer.from(pdf) }] });
            sent.push(payslip.id);
        }
        catch (error) {
            failed.push({ payslipId: payslip.id, reason: error instanceof Error ? error.message : "Delivery failed" });
        }
    }
    return { sent: sent.length, failed: failed.length, failures: failed };
}
