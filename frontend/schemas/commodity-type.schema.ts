import { z } from 'zod';
import { entityStatusSchema } from './common.schema';

export const CommodityTypeSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    status: entityStatusSchema,
    createdBy: z.string().nullable(),
    updatedBy: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateCommodityTypeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
});

export const UpdateCommodityTypeSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    status: entityStatusSchema.optional(),
});

export const CommodityTypeListParamsSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    status: entityStatusSchema.optional(),
});

export type CommodityType = z.infer<typeof CommodityTypeSchema>;
export type CreateCommodityTypeDto = z.infer<typeof CreateCommodityTypeSchema>;
export type UpdateCommodityTypeDto = z.infer<typeof UpdateCommodityTypeSchema>;
export type CommodityTypeListParams = z.infer<typeof CommodityTypeListParamsSchema>;
