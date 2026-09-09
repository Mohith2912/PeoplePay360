INSERT INTO `TimeOffType` (`id`, `name`, `code`, `unit`, `requiresAllocation`, `approvalRequired`, `payrollIntegration`, `isPaid`, `createdAt`, `updatedAt`)
VALUES ('default-casual-leave', 'Casual Leave', 'CASUAL', 'DAYS', true, true, true, true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `unit` = VALUES(`unit`),
  `requiresAllocation` = VALUES(`requiresAllocation`),
  `approvalRequired` = VALUES(`approvalRequired`),
  `payrollIntegration` = VALUES(`payrollIntegration`),
  `isPaid` = VALUES(`isPaid`),
  `updatedAt` = CURRENT_TIMESTAMP(3);

UPDATE `TimeOffType`
SET `requiresAllocation` = false, `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `code` = 'UNPAID';
