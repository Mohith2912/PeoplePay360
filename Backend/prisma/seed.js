import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!", 12);
    await prisma.user.upsert({ where: { email: process.env.SEED_ADMIN_EMAIL ?? "admin@peoplepay360.local" }, update: {}, create: { name: "System Administrator", email: process.env.SEED_ADMIN_EMAIL ?? "admin@peoplepay360.local", passwordHash, role: "ADMIN" } });
    await prisma.salaryStructure.upsert({ where: { code: "STANDARD" }, update: {}, create: { name: "Standard Employee", code: "STANDARD", salaryRules: { create: [{ name: "Basic Salary", code: "BASIC", category: "BASIC", sequence: 10, computationType: "FORMULA", value: "wage" }, { name: "Housing Allowance", code: "HRA", category: "ALLOWANCE", sequence: 20, computationType: "PERCENTAGE", value: "40", baseCode: "BASIC" }, { name: "Gross Salary", code: "GROSS", category: "GROSS", sequence: 30, computationType: "FORMULA", value: "BASIC + HRA" }] } } });
}
main().finally(() => prisma.$disconnect());
