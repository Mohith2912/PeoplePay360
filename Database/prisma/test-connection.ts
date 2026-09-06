import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const [employeeCount, salaryStructureCount, timeOffTypeCount] = await Promise.all([
      prisma.employee.count(),
      prisma.salaryStructure.count(),
      prisma.timeOffType.count(),
    ]);

    console.log('Database connection OK');
    console.log({ employeeCount, salaryStructureCount, timeOffTypeCount });
  } catch (error) {
    console.error('Database connection test failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
