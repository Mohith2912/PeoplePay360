import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
export const roles = ["EMPLOYEE", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"];
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "development-only-secret");
export async function hashPassword(password) { return bcrypt.hash(password, 12); }
export async function verifyPassword(password, hash) { return bcrypt.compare(password, hash); }
export async function createToken(user) {
    return new SignJWT({ role: user.role }).setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setExpirationTime(process.env.JWT_EXPIRES_IN ?? "8h").sign(secret);
}
export async function requireAuth() {
    const store = await cookies();
    const cookieToken = store.get("peoplepay_token")?.value ?? store.get("token")?.value;
    const authorization = (await headers()).get("authorization");
    const headerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    const token = cookieToken ?? headerToken;
    if (!token)
        throw new UnauthorizedError("Authentication is required");
    try {
        const { payload } = await jwtVerify(token, secret);
        if (!payload.sub)
            throw new Error("Missing subject");
        const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { employee: true } });
<<<<<<< HEAD
        if (!user || !user.isActive)
=======
        if (!user)
>>>>>>> origin/master
            throw new Error("User is inactive");
        return user;
    }
    catch {
        throw new UnauthorizedError("Invalid or expired authentication token");
    }
}
export function requireRoles(user, ...allowed) {
    if (!allowed.includes(user.role))
        throw new ForbiddenError("You do not have permission for this action");
}
export function isPayrollReader(role) { return ["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role); }
export function isPayrollManager(role) { return ["HR_PAYROLL_MANAGER", "ADMIN"].includes(role); }
export function isHr(role) { return ["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"].includes(role); }
