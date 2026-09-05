import { prisma } from "@/lib/prisma";
export async function audit(userId, action, entityType, entityId, metadata) {
    await prisma.auditLog.create({ data: { userId, action, entityType, entityId, metadata: metadata } });
}
