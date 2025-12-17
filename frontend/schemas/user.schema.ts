import { z } from 'zod';
import { entityStatusSchema, roleTypeSchema } from '@/schemas/common.schema';
import { siteSchema } from '@/schemas/sites.schema';

export const siteUserRoleSchema = z.enum(['ADMIN', 'OPERATOR']);

export const siteUserSchema = z.object({
    id: z.string(),
    userId: z.string(),
    siteId: z.string(),
    siteRole: siteUserRoleSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    site: siteSchema.optional(),
});

export const userRoleSchema = z.object({
    id: z.number(),
    userId: z.string(),
    role: roleTypeSchema,
    organizationId: z.string().nullable().optional(),
    siteId: z.string().nullable().optional(),
    grantedByUserId: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    // Relations
    // organization: organizationSchema.optional(),
    site: siteSchema.optional(),
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
    roles: z.array(userRoleSchema).optional(),
    siteUsers: z.array(siteUserSchema).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createUserSchema = z.object({
    organizationId: z.string().min(1, 'Organization is required'),
    email: z.string().email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    role: roleTypeSchema,
    phone: z.string().optional(),
    password: z.string().optional(),
    languagePreference: z.string().optional(),
});

export const userListParamsSchema = z.object({
    organizationId: z.string().optional(),
    status: entityStatusSchema.optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UserListParams = z.infer<typeof userListParamsSchema>;
