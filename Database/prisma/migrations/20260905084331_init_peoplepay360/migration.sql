-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN') NOT NULL,
    `employeeId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` VARCHAR(191) NOT NULL,
    `employeeCode` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `dateOfJoining` DATETIME(3) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `employeeType` ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN') NOT NULL,
    `managerId` VARCHAR(191) NULL,
    `workingScheduleId` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'NOTICE_PERIOD', 'TERMINATED') NOT NULL,
    `pan` VARCHAR(191) NULL,
    `uan` VARCHAR(191) NULL,
    `pfNumber` VARCHAR(191) NULL,
    `esiNumber` VARCHAR(191) NULL,
    `bankName` VARCHAR(191) NULL,
    `bankAccountNumber` VARCHAR(191) NULL,
    `bankIFSC` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_employeeCode_key`(`employeeCode`),
    INDEX `Employee_email_idx`(`email`),
    INDEX `Employee_department_idx`(`department`),
    INDEX `Employee_status_idx`(`status`),
    INDEX `Employee_employeeType_idx`(`employeeType`),
    INDEX `Employee_dateOfJoining_idx`(`dateOfJoining`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkingSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('STANDARD', 'SHIFT', 'FLEXIBLE') NOT NULL,
    `weeklyHours` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScheduleDay` (
    `id` VARCHAR(191) NOT NULL,
    `workingScheduleId` VARCHAR(191) NOT NULL,
    `dayOfWeek` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `isWorkingDay` BOOLEAN NOT NULL DEFAULT true,
    `startTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `breakMinutes` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScheduleDay_workingScheduleId_idx`(`workingScheduleId`),
    UNIQUE INDEX `ScheduleDay_workingScheduleId_dayOfWeek_key`(`workingScheduleId`, `dayOfWeek`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contract` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `department` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `wage` DECIMAL(18, 2) NOT NULL,
    `salaryStructureId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'ENDED', 'CANCELLED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Contract_employeeId_idx`(`employeeId`),
    INDEX `Contract_startDate_idx`(`startDate`),
    INDEX `Contract_endDate_idx`(`endDate`),
    INDEX `Contract_status_idx`(`status`),
    INDEX `Contract_salaryStructureId_idx`(`salaryStructureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceRecord` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `workedHours` DECIMAL(10, 2) NOT NULL,
    `breakMinutes` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PRESENT', 'LATE', 'ABSENT', 'EXCEPTION') NOT NULL,
    `isManuallyCorrected` BOOLEAN NOT NULL DEFAULT false,
    `correctedByUserId` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AttendanceRecord_employeeId_idx`(`employeeId`),
    INDEX `AttendanceRecord_date_idx`(`date`),
    INDEX `AttendanceRecord_status_idx`(`status`),
    UNIQUE INDEX `AttendanceRecord_employeeId_date_key`(`employeeId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeOffType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `unit` ENUM('DAYS', 'HOURS') NOT NULL,
    `requiresAllocation` BOOLEAN NOT NULL DEFAULT true,
    `approvalRequired` BOOLEAN NOT NULL DEFAULT true,
    `payrollIntegration` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TimeOffType_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeOffAllocation` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `timeOffTypeId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `allocatedAmount` DECIMAL(10, 2) NOT NULL,
    `takenAmount` DECIMAL(10, 2) NOT NULL,
    `remainingAmount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TimeOffAllocation_employeeId_idx`(`employeeId`),
    INDEX `TimeOffAllocation_timeOffTypeId_idx`(`timeOffTypeId`),
    INDEX `TimeOffAllocation_status_idx`(`status`),
    INDEX `TimeOffAllocation_periodStart_idx`(`periodStart`),
    INDEX `TimeOffAllocation_periodEnd_idx`(`periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeOffRequest` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `timeOffTypeId` VARCHAR(191) NOT NULL,
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NOT NULL,
    `duration` DECIMAL(10, 2) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL,
    `approvedByUserId` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TimeOffRequest_employeeId_idx`(`employeeId`),
    INDEX `TimeOffRequest_timeOffTypeId_idx`(`timeOffTypeId`),
    INDEX `TimeOffRequest_status_idx`(`status`),
    INDEX `TimeOffRequest_fromDate_idx`(`fromDate`),
    INDEX `TimeOffRequest_toDate_idx`(`toDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalaryStructure` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SalaryStructure_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SalaryRule` (
    `id` VARCHAR(191) NOT NULL,
    `salaryStructureId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` ENUM('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'CONTRIBUTION', 'NET', 'REIMBURSEMENT') NOT NULL,
    `sequence` INTEGER NOT NULL,
    `computationType` ENUM('FIXED', 'PERCENTAGE', 'FORMULA') NOT NULL,
    `value` DECIMAL(18, 2) NULL,
    `formula` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SalaryRule_salaryStructureId_idx`(`salaryStructureId`),
    INDEX `SalaryRule_category_idx`(`category`),
    INDEX `SalaryRule_sequence_idx`(`sequence`),
    INDEX `SalaryRule_isActive_idx`(`isActive`),
    UNIQUE INDEX `SalaryRule_salaryStructureId_code_key`(`salaryStructureId`, `code`),
    UNIQUE INDEX `SalaryRule_salaryStructureId_sequence_key`(`salaryStructureId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payrun` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `salaryStructureId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED') NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payrun_periodStart_idx`(`periodStart`),
    INDEX `Payrun_periodEnd_idx`(`periodEnd`),
    INDEX `Payrun_status_idx`(`status`),
    INDEX `Payrun_salaryStructureId_idx`(`salaryStructureId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrunEmployee` (
    `id` VARCHAR(191) NOT NULL,
    `payrunId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PayrunEmployee_payrunId_idx`(`payrunId`),
    INDEX `PayrunEmployee_employeeId_idx`(`employeeId`),
    UNIQUE INDEX `PayrunEmployee_payrunId_employeeId_key`(`payrunId`, `employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payslip` (
    `id` VARCHAR(191) NOT NULL,
    `payrunId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `workedDays` DECIMAL(10, 2) NOT NULL,
    `grossEarnings` DECIMAL(18, 2) NOT NULL,
    `grossDeductions` DECIMAL(18, 2) NOT NULL,
    `netPay` DECIMAL(18, 2) NOT NULL,
    `totalReimbursement` DECIMAL(18, 2) NOT NULL,
    `netTransfer` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED') NOT NULL,
    `paidAt` DATETIME(3) NULL,
    `emailedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payslip_employeeId_idx`(`employeeId`),
    INDEX `Payslip_periodStart_idx`(`periodStart`),
    INDEX `Payslip_periodEnd_idx`(`periodEnd`),
    INDEX `Payslip_status_idx`(`status`),
    INDEX `Payslip_payrunId_idx`(`payrunId`),
    UNIQUE INDEX `Payslip_payrunId_employeeId_key`(`payrunId`, `employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayslipLine` (
    `id` VARCHAR(191) NOT NULL,
    `payslipId` VARCHAR(191) NOT NULL,
    `salaryRuleId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` ENUM('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'CONTRIBUTION', 'NET', 'REIMBURSEMENT') NOT NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayslipLine_payslipId_idx`(`payslipId`),
    INDEX `PayslipLine_salaryRuleId_idx`(`salaryRuleId`),
    INDEX `PayslipLine_category_idx`(`category`),
    INDEX `PayslipLine_sequence_idx`(`sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollWarning` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` ENUM('EMPLOYEE', 'CONTRACT', 'PAYRUN', 'PAYSLIP', 'ATTENDANCE', 'TIME_OFF') NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `warningType` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'ERROR') NOT NULL,
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedByUserId` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayrollWarning_entityType_idx`(`entityType`),
    INDEX `PayrollWarning_entityId_idx`(`entityId`),
    INDEX `PayrollWarning_warningType_idx`(`warningType`),
    INDEX `PayrollWarning_severity_idx`(`severity`),
    INDEX `PayrollWarning_isResolved_idx`(`isResolved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `metadata` JSON NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_entityType_idx`(`entityType`),
    INDEX `AuditLog_entityId_idx`(`entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `payslipId` VARCHAR(191) NOT NULL,
    `paymentReference` VARCHAR(191) NULL,
    `paymentMethod` ENUM('BANK_TRANSFER', 'CASH', 'OTHER') NOT NULL,
    `paymentDate` DATETIME(3) NULL,
    `amount` DECIMAL(18, 2) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_payslipId_key`(`payslipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_workingScheduleId_fkey` FOREIGN KEY (`workingScheduleId`) REFERENCES `WorkingSchedule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScheduleDay` ADD CONSTRAINT `ScheduleDay_workingScheduleId_fkey` FOREIGN KEY (`workingScheduleId`) REFERENCES `WorkingSchedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract` ADD CONSTRAINT `Contract_salaryStructureId_fkey` FOREIGN KEY (`salaryStructureId`) REFERENCES `SalaryStructure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_correctedByUserId_fkey` FOREIGN KEY (`correctedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeOffAllocation` ADD CONSTRAINT `TimeOffAllocation_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeOffAllocation` ADD CONSTRAINT `TimeOffAllocation_timeOffTypeId_fkey` FOREIGN KEY (`timeOffTypeId`) REFERENCES `TimeOffType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeOffRequest` ADD CONSTRAINT `TimeOffRequest_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeOffRequest` ADD CONSTRAINT `TimeOffRequest_timeOffTypeId_fkey` FOREIGN KEY (`timeOffTypeId`) REFERENCES `TimeOffType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeOffRequest` ADD CONSTRAINT `TimeOffRequest_approvedByUserId_fkey` FOREIGN KEY (`approvedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SalaryRule` ADD CONSTRAINT `SalaryRule_salaryStructureId_fkey` FOREIGN KEY (`salaryStructureId`) REFERENCES `SalaryStructure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payrun` ADD CONSTRAINT `Payrun_salaryStructureId_fkey` FOREIGN KEY (`salaryStructureId`) REFERENCES `SalaryStructure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payrun` ADD CONSTRAINT `Payrun_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrunEmployee` ADD CONSTRAINT `PayrunEmployee_payrunId_fkey` FOREIGN KEY (`payrunId`) REFERENCES `Payrun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrunEmployee` ADD CONSTRAINT `PayrunEmployee_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payslip` ADD CONSTRAINT `Payslip_payrunId_fkey` FOREIGN KEY (`payrunId`) REFERENCES `Payrun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payslip` ADD CONSTRAINT `Payslip_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayslipLine` ADD CONSTRAINT `PayslipLine_payslipId_fkey` FOREIGN KEY (`payslipId`) REFERENCES `Payslip`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayslipLine` ADD CONSTRAINT `PayslipLine_salaryRuleId_fkey` FOREIGN KEY (`salaryRuleId`) REFERENCES `SalaryRule`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollWarning` ADD CONSTRAINT `PayrollWarning_resolvedByUserId_fkey` FOREIGN KEY (`resolvedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_payslipId_fkey` FOREIGN KEY (`payslipId`) REFERENCES `Payslip`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
