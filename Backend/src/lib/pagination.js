import { z } from "zod";
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
});
export function pagination(page, limit) {
    return { skip: (page - 1) * limit, take: limit };
}
export function meta(total, page, limit) {
    return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
