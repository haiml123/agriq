import { z } from 'zod';

const EntityStatusEnum = z.enum(['ACTIVE', 'PENDING', 'BLOCKED', 'DELETED']);

export const CommodityTypeSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    status: EntityStatusEnum,
    isActive: z.boolean().optional(),
    commoditiesCount: z.number().optional(),
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
    isActive: z.boolean().optional(),
});

export const CommodityTypeListParamsSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    isActive: z.boolean().optional(),
});

export type CommodityType = z.infer<typeof CommodityTypeSchema>;
export type CreateCommodityTypeDto = z.infer<typeof CreateCommodityTypeSchema>;
export type UpdateCommodityTypeDto = z.infer<typeof UpdateCommodityTypeSchema>;
export type CommodityTypeListParams = z.infer<typeof CommodityTypeListParamsSchema>;
export type EntityStatus = z.infer<typeof EntityStatusEnum>;
