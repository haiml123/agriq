import { z } from 'zod';

export const LookupTableDataSchema = z.object({
    tempRanges: z.array(z.number()),
    humidityRanges: z.array(z.number()),
    values: z.array(z.array(z.number())),
});

export const LookupTableSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    commodityTypeId: z.string(),
    data: LookupTableDataSchema,
    createdBy: z.string().nullable().optional(),
    updatedBy: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const CreateLookupTableSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
    data: LookupTableDataSchema,
});

export const UpdateLookupTableSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    data: LookupTableDataSchema.optional(),
});

export type LookupTableData = z.infer<typeof LookupTableDataSchema>;
export type LookupTable = z.infer<typeof LookupTableSchema>;
export type CreateLookupTableDto = z.infer<typeof CreateLookupTableSchema>;
export type UpdateLookupTableDto = z.infer<typeof UpdateLookupTableSchema>;
