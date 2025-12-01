import { z } from 'zod';

export const EntityStatus = {
    ACTIVE: 'ACTIVE',
    BLOCKED: 'BLOCKED',
    DELETED: 'DELETED',
} as const;

export type EntityStatus = (typeof EntityStatus)[keyof typeof EntityStatus];

export const EntityStatusSchema = z.enum(['ACTIVE', 'BLOCKED', 'DELETED']);

export const OrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: EntityStatusSchema,
    createdBy: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateOrganizationSchema = z.object({
    name: z.string().min(2).max(100),
});

export const UpdateOrganizationSchema = z.object({
    name: z.string().min(2).max(100).optional(),
});

export const ChangeStatusSchema = z.object({
    status: EntityStatusSchema,
});

export const OrganizationListParamsSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    status: EntityStatusSchema.optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    });

export const PaginatedOrganizationsSchema = PaginatedResponseSchema(OrganizationSchema);

export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;
export type ChangeStatusDto = z.infer<typeof ChangeStatusSchema>;
export type OrganizationListParams = z.infer<typeof OrganizationListParamsSchema>;
export type PaginatedOrganizations = z.infer<typeof PaginatedOrganizationsSchema>;
export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};