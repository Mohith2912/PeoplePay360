import { prisma } from '@/lib/prisma';
import { handler, reply, check } from './http';

export async function notifyEmployee(tx, employeeId, notification) {
  const account = await tx.user.findUnique({ where: { employeeId }, select: { id: true } });
  if (!account) return null;
  return tx.notification.create({ data: { userId: account.id, ...notification } });
}

export const notificationsGET = handler(async ({ user, query }) => {
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const [rows, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return reply(rows, 200, { unreadCount });
});

export const notificationPUT = handler(async ({ user, params }) => {
  const notification = await prisma.notification.findFirst({ where: { id: params.id, userId: user.id } });
  check(notification, 'Notification not found', 404);
  return reply(await prisma.notification.update({ where: { id: notification.id }, data: { readAt: notification.readAt || new Date() } }));
});
