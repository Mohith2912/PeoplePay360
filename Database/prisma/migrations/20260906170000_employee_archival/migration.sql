ALTER TABLE `Employee`
  ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX `Employee_isArchived_idx` ON `Employee`(`isArchived`);
