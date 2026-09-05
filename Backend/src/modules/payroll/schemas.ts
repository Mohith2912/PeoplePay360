import { z } from "zod";

const periodFields = { periodStart: z.coerce.date(), periodEnd: z.coerce.date() };
export const periodSchema = z.object(periodFields).refine((value) => value.periodStart <= value.periodEnd, { message: "periodStart must be before periodEnd", path: ["periodEnd"] });
export const payrunCreateSchema = z.object({ ...periodFields, name: z.string().min(2).max(120), salaryStructureId: z.string().min(1), employeeIds: z.array(z.string().min(1)).min(1) }).refine((value) => value.periodStart <= value.periodEnd, { message: "periodStart must be before periodEnd", path: ["periodEnd"] });
