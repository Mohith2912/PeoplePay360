import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";

export const roles = ["EMPLOYEE", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"] as const;
export type Role = (typeof roles)[number];

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "development-only-secret");

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password: string, hash: string) { return bcrypt.compare(password, hash); }

export async function createToken(user: { id: string; role: Role }) {
  return new SignJWT({ role: user.role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime(process.env.JWT_EXPIRES_IN ?? "8h").sign(secret);
}

export async function requireAuth() {
  const store = await cookies();
  const token = store.get("peoplepay_token")?.value ?? store.get("token")?.value;
  if (!token) throw new UnauthorizedError("Authentication is required");
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) throw new Error("Missing subject");
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { employee: true } });
    if (!user || !user.isActive) throw new Error("User is inactive");
    return user;
  } catch { throw new UnauthorizedError("Invalid or expired authentication token"); }
}

export function requireRoles(user: { role: string }, ...allowed: Role[]) {
  if (!allowed.includes(user.role as Role)) throw new ForbiddenError("You do not have permission for this action");
}

export function isPayrollReader(role: string) { return ["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role); }
export function isPayrollManager(role: string) { return ["HR_PAYROLL_MANAGER", "ADMIN"].includes(role); }
export function isHr(role: string) { return ["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role); }
