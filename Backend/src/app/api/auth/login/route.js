import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";
import { failure, handleError, success } from "@/lib/api";
import { z } from "zod";
import { cookies } from "next/headers";
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export async function POST(request) {
    try {
        const input = loginSchema.parse(await request.json());
        const user = await prisma.user.findUnique({ where: { email: input.email }, include: { employee: true } });
        if (!user || !(await verifyPassword(input.password, user.passwordHash)))
            return failure("Invalid email or password", 401);
        const token = await createToken(user);
        (await cookies()).set("peoplepay_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 8, path: "/" });
        return success({ user: { id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employee?.id, createdAt: user.createdAt, updatedAt: user.updatedAt } }, "Login successful");
    }
    catch (error) {
        return handleError(error);
    }
}
