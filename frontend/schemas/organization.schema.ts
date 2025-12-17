import { z } from 'zod';
import { entityStatusSchema } from '@/schemas/common.schema';
import { siteSchema } from '@/schemas/sites.schema';
import { userSchema } from '@/schemas/user.schema';
import { triggerSchema } from '@/schemas/trigger.schema';

export const organizationSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: entityStatusSchema,
    createdBy: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),

    users: z.array(z.lazy(() => userSchema)).optional(),
    sites: z.array(z.lazy(() => siteSchema)).optional(),
    eventTriggers: z.array(z.lazy(() => triggerSchema)).optional(),
});

export const createOrganizationSchema = z.object({
    name: z.string().min(2).max(100),
});

export const updateOrganizationSchema = z.object({
    name: z.string().min(2).max(100).optional(),
});

export const changeStatusSchema = z.object({
    status: entityStatusSchema,
});

export const organizationListParamsSchema = z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    search: z.string().optional(),
    status: entityStatusSchema.optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    });

export const paginatedOrganizationsSchema = paginatedResponseSchema(organizationSchema);

export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;
export type ChangeStatusDto = z.infer<typeof changeStatusSchema>;
export type OrganizationListParams = z.infer<typeof organizationListParamsSchema>;
export type PaginatedOrganizations = z.infer<typeof paginatedOrganizationsSchema>;
export type PaginatedResponse<T> = {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
