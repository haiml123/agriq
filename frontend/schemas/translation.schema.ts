import { z } from 'zod';

export const TranslationSchema = z.object({
    id: z.string(),
    entity: z.string(),
    entityId: z.string(),
    field: z.string(),
    locale: z.string(),
    text: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const TranslationListParamsSchema = z.object({
    entity: z.string(),
    field: z.string().optional(),
    locale: z.string().optional(),
    entityIds: z.array(z.string()).optional(),
});

export const CreateTranslationSchema = z.object({
    entity: z.string(),
    entityId: z.string(),
    field: z.string(),
    locale: z.string(),
    text: z.string(),
});

export const UpsertTranslationsSchema = z.object({
    translations: z.array(CreateTranslationSchema).min(1),
});

export type Translation = z.infer<typeof TranslationSchema>;
export type TranslationListParams = z.infer<typeof TranslationListParamsSchema>;
export type CreateTranslationDto = z.infer<typeof CreateTranslationSchema>;
export type UpsertTranslationsDto = z.infer<typeof UpsertTranslationsSchema>;
