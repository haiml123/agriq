import { z } from 'zod'

export const LookupTableDataSchema = z.object({
    tempRanges: z.array(z.number()),
    humidityRanges: z.array(z.number()),
    values: z.array(z.array(z.number())),
})

export const LookupTableSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    commodityTypeId: z.string(),
    data: LookupTableDataSchema,
    createdBy: z.string().nullable(),
    updatedBy: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
})

export const CreateLookupTableSchema = z.object({
    name: z.string().min(1, 'Table name is required'),
    description: z.string().optional(),
    data: LookupTableDataSchema,
})

export const UpdateLookupTableSchema = z.object({
    name: z.string().optional(),
    description: z.string().nullable().optional(),
    data: LookupTableDataSchema.optional(),
})

export const LookupTableListParamsSchema = z.object({
    commodityTypeId: z.string().optional(),
})

export type LookupTableData = z.infer<typeof LookupTableDataSchema>
export type LookupTable = z.infer<typeof LookupTableSchema>
export type CreateLookupTableDto = z.infer<typeof CreateLookupTableSchema>
export type UpdateLookupTableDto = z.infer<typeof UpdateLookupTableSchema>
export type LookupTableListParams = z.infer<typeof LookupTableListParamsSchema>
