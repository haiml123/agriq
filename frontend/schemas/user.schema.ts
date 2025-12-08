import { z } from 'zod';
import { EntityStatusSchema } from './organization.schema';

export const RoleType = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ORG_ADMIN: 'ORG_ADMIN',
    OPERATOR: 'OPERATOR',
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];

export const RoleTypeSchema = z.enum(['SUPER_ADMIN', 'ORG_ADMIN', 'OPERATOR']);

export const UserRoleSchema = z.object({
    id: z.number(),
    role: RoleTypeSchema,
    organizationId: z.string().nullable(),
    siteId: z.string().nullable(),
    grantedByUserId: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const UserOrganizationSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const UserSchema = z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    phone: z.string().nullable(),
    status: EntityStatusSchema,
    languagePreference: z.string().nullable(),
    organizationId: z.string().nullable(),
    organization: UserOrganizationSchema.nullable().optional(),
    roles: z.array(UserRoleSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const CreateUserSchema = z.object({
    organizationId: z.string().min(1, 'Organization is required'),
    email: z.string().email('Invalid email'),
    name: z.string().min(1, 'Name is required'),
    role: RoleTypeSchema,
    phone: z.string().optional(),
    password: z.string().optional(),
    languagePreference: z.string().optional(),
});

export const UserListParamsSchema = z.object({
    organizationId: z.string().optional(),
    status: EntityStatusSchema.optional(),
    search: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UserListParams = z.infer<typeof UserListParamsSchema>;

export const RoleTypeEnum = RoleTypeSchema.enum;
