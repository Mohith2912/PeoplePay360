const ANNUAL_LEAVE_DAYS = 12;

export async function ensureAnnualLeaveAllocation(tx, employeeId, effectiveDate = new Date()) {
  const year = effectiveDate.getUTCFullYear();
  const periodStart = new Date(Date.UTC(year, 0, 1));
  const periodEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const timeOffType = await tx.timeOffType.upsert({
    where: { code: 'ANNUAL' },
    update: {},
    create: {
      name: 'Annual Leave',
      code: 'ANNUAL',
      unit: 'DAYS',
      requiresAllocation: true,
      approvalRequired: true,
      payrollIntegration: true,
      isPaid: true,
    },
  });
  const existing = await tx.timeOffAllocation.findFirst({
    where: {
      employeeId,
      timeOffTypeId: timeOffType.id,
      periodStart: { lte: periodEnd },
      periodEnd: { gte: periodStart },
      status: 'ACTIVE',
    },
  });
  if (existing) return { allocation: existing, created: false };
  const allocation = await tx.timeOffAllocation.create({
    data: {
      employeeId,
      timeOffTypeId: timeOffType.id,
      periodStart,
      periodEnd,
      allocatedAmount: ANNUAL_LEAVE_DAYS,
      takenAmount: 0,
      remainingAmount: ANNUAL_LEAVE_DAYS,
      status: 'ACTIVE',
    },
  });
  return { allocation, created: true };
}
