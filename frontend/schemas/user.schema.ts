import { z } from 'zod';
import { entityStatusSchema, roleTypeSchema, siteRoleSchema } from '@/schemas/common.schema';
import { siteSchema } from '@/schemas/sites.schema';

export const siteUserSchema = z.object({
    userId: z.string(),
    siteId: z.string(),
    siteRole: siteRoleSchema,
    site: siteSchema.pick({ id: true, name: true, organizationId: true }).optional(),
});

export const userOrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const userSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    phone: z.string().nullable(),
    status: entityStatusSchema,
    languagePreference: z.string().nullable(),
    organizationId: z.string().nullable(),
    organization: userOrganizationSchema.nullable().optional(),
    userRole: roleTypeSchema,
    siteUsers: z.array(siteUserSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createUserSchema = z.object({
    organizationId: z.string().min(1, 'Organization is required').optional(),
    email: z.string().email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    role: roleTypeSchema,
    phone: z.string().optional(),
    password: z.string().optional(),
    languagePreference: z.string().optional(),
    siteIds: z.array(z.string()).optional(),
});

export const userListParamsSchema = z.object({
    organizationId: z.string().optional(),
    status: entityStatusSchema.optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
});

export type SiteUser = z.infer<typeof siteUserSchema>;
export type User = z.infer<typeof userSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UserListParams = z.infer<typeof userListParamsSchema>;
