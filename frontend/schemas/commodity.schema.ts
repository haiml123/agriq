import { z } from 'zod';

export const CommoditySchema = z.object({
    id: z.string(),
    name: z.string(),
    origin: z.string().nullable(),
    commodityTypeId: z.string().nullable(),
    commodityType: z.object({
        id: z.string(),
        name: z.string(),
    }).nullable().optional(),
    organizationId: z.string().nullable(),
    createdBy: z.string().nullable(),
    updatedBy: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateCommoditySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    origin: z.string().max(100).optional(),
    commodityTypeId: z.string().optional(),
    organizationId: z.string().optional(),
});

export const UpdateCommoditySchema = z.object({
    name: z.string().min(2).max(100).optional(),
    origin: z.string().max(100).optional(),
    commodityTypeId: z.string().optional(),
});

export type Commodity = z.infer<typeof CommoditySchema>;
export type CreateCommodityDto = z.infer<typeof CreateCommoditySchema>;
export type UpdateCommodityDto = z.infer<typeof UpdateCommoditySchema>;
