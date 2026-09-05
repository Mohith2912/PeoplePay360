import { prisma } from "@/lib/prisma";

export async function audit(userId: string | undefined, action: string, entityType: string, entityId: string | undefined, metadata?: unknown) {
  await prisma.auditLog.create({ data: { userId, action, entityType, entityId, metadata: metadata as object | undefined } });
}
