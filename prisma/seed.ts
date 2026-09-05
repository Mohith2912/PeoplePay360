import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@peoplepay360.local';
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(defaultAdminPassword, 10);

  await prisma.user.upsert({
    where: { email: defaultAdminEmail },
    update: {
      name: 'System Administrator',
      role: 'ADMIN',
      passwordHash,
    },
    create: {
      name: 'System Administrator',
      email: defaultAdminEmail,
      passwordHash,
      role: 'ADMIN',
    },
  });

  const salaryStructure = await prisma.salaryStructure.upsert({
    where: { code: 'STD_2025' },
    update: {},
    create: {
      name: 'Standard Salary Structure',
      code: 'STD_2025',
      description: 'Default salary template for PeoplePay360',
      isActive: true,
    },
  });

  const rules = [
    {
      name: 'Basic Salary',
      code: 'BASIC',
      category: 'BASIC',
      sequence: 10,
      computationType: 'FIXED',
      value: '30000',
    },
    {
      name: 'House Rent Allowance',
      code: 'HRA',
      category: 'ALLOWANCE',
      sequence: 20,
      computationType: 'PERCENTAGE',
      value: '15',
    },
    {
      name: 'Gross Salary',
      code: 'GROSS',
      category: 'GROSS',
      sequence: 30,
      computationType: 'FORMULA',
      formula: 'BASIC + HRA',
    },
    {
      name: 'Provident Fund',
      code: 'PF',
      category: 'DEDUCTION',
      sequence: 40,
      computationType: 'PERCENTAGE',
      value: '12',
    },
    {
      name: 'Net Salary',
      code: 'NET',
      category: 'NET',
      sequence: 50,
      computationType: 'FORMULA',
      formula: 'GROSS - PF',
    },
  ] as const;

  for (const rule of rules) {
    await prisma.salaryRule.upsert({
      where: {
        salaryStructureId_code: {
          salaryStructureId: salaryStructure.id,
          code: rule.code,
        },
      },
      update: {
        name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        computationType: rule.computationType,
        value: rule.value ? rule.value : null,
        formula: rule.formula ?? null,
        isActive: true,
      },
      create: {
        salaryStructureId: salaryStructure.id,
        name: rule.name,
        code: rule.code,
        category: rule.category,
        sequence: rule.sequence,
        computationType: rule.computationType,
        value: rule.value ? rule.value : null,
        formula: rule.formula ?? null,
        isActive: true,
      },
    });
  }

  const leaveTypes = [
    {
      name: 'Annual Leave',
      code: 'ANNUAL',
      unit: 'DAYS',
      requiresAllocation: true,
      approvalRequired: true,
      payrollIntegration: true,
    },
    {
      name: 'Sick Leave',
      code: 'SICK',
      unit: 'DAYS',
      requiresAllocation: true,
      approvalRequired: true,
      payrollIntegration: false,
    },
  ] as const;

  for (const leaveType of leaveTypes) {
    await prisma.timeOffType.upsert({
      where: { code: leaveType.code },
      update: {
        name: leaveType.name,
        unit: leaveType.unit,
        requiresAllocation: leaveType.requiresAllocation,
        approvalRequired: leaveType.approvalRequired,
        payrollIntegration: leaveType.payrollIntegration,
      },
      create: leaveType,
    });
  }

  const standardSchedule = await prisma.workingSchedule.upsert({
    where: { id: 'default-standard-schedule' },
    update: {},
    create: {
      id: 'default-standard-schedule',
      name: 'Standard Week',
      type: 'STANDARD',
      weeklyHours: '40',
    },
  });

  const weekDays = [
    { dayOfWeek: 'MONDAY', isWorkingDay: true, startTime: '2024-01-01T09:00:00.000Z', endTime: '2024-01-01T18:00:00.000Z', breakMinutes: 60 },
    { dayOfWeek: 'TUESDAY', isWorkingDay: true, startTime: '2024-01-01T09:00:00.000Z', endTime: '2024-01-01T18:00:00.000Z', breakMinutes: 60 },
    { dayOfWeek: 'WEDNESDAY', isWorkingDay: true, startTime: '2024-01-01T09:00:00.000Z', endTime: '2024-01-01T18:00:00.000Z', breakMinutes: 60 },
    { dayOfWeek: 'THURSDAY', isWorkingDay: true, startTime: '2024-01-01T09:00:00.000Z', endTime: '2024-01-01T18:00:00.000Z', breakMinutes: 60 },
    { dayOfWeek: 'FRIDAY', isWorkingDay: true, startTime: '2024-01-01T09:00:00.000Z', endTime: '2024-01-01T18:00:00.000Z', breakMinutes: 60 },
    { dayOfWeek: 'SATURDAY', isWorkingDay: false, startTime: null, endTime: null, breakMinutes: 0 },
    { dayOfWeek: 'SUNDAY', isWorkingDay: false, startTime: null, endTime: null, breakMinutes: 0 },
  ] as const;

  for (const day of weekDays) {
    await prisma.scheduleDay.upsert({
      where: {
        workingScheduleId_dayOfWeek: {
          workingScheduleId: standardSchedule.id,
          dayOfWeek: day.dayOfWeek,
        },
      },
      update: {
        isWorkingDay: day.isWorkingDay,
        startTime: day.startTime ? new Date(day.startTime) : null,
        endTime: day.endTime ? new Date(day.endTime) : null,
        breakMinutes: day.breakMinutes,
      },
      create: {
        workingScheduleId: standardSchedule.id,
        dayOfWeek: day.dayOfWeek,
        isWorkingDay: day.isWorkingDay,
        startTime: day.startTime ? new Date(day.startTime) : null,
        endTime: day.endTime ? new Date(day.endTime) : null,
        breakMinutes: day.breakMinutes,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
