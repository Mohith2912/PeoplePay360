import { cookies } from "next/headers";
import { handleError, success } from "@/lib/api";
export async function POST() {
    try {
        (await cookies()).set("peoplepay_token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", expires: new Date(0), path: "/" });
        return success(null, "Logged out");
    }
    catch (error) {
        return handleError(error);
    }
}
