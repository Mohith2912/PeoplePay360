import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function success<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function failure(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, message, ...(errors ? { errors } : {}) }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) return failure("Validation failed", 400, error.flatten().fieldErrors);
  if (error instanceof Error && error.name === "UnauthorizedError") return failure(error.message, 401);
  if (error instanceof Error && error.name === "ForbiddenError") return failure(error.message, 403);
  if (error instanceof Error && error.name === "NotFoundError") return failure(error.message, 404);
  if (error instanceof Error && error.name === "ConflictError") return failure(error.message, 409);
  console.error(error);
  return failure("An unexpected error occurred", 500);
}
