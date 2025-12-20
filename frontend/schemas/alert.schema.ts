import { z } from 'zod';
import { severitySchema, alertStatusSchema } from '@/schemas/common.schema';

// Nested schemas for related entities
export const alertSiteSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const alertCompoundSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const alertCellSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const alertUserSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const alertCommoditySchema = z.object({
    id: z.string(),
    name: z.string(),
});

// Main alert schema from API
export const apiAlertSchema = z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    severity: severitySchema,
    status: alertStatusSchema,
    startedAt: z.string(),
    resolvedAt: z.string().nullable().optional(),
    site: alertSiteSchema.optional(),
    compound: alertCompoundSchema.optional(),
    cell: alertCellSchema.optional(),
    user: alertUserSchema.optional(),
    commodity: alertCommoditySchema.optional(),
    organizationId: z.string().optional(),
});

// Dashboard alert schema (formatted for display)
export const dashboardAlertSchema = z.object({
    id: z.string(),
    description: z.string(),
    severity: severitySchema,
    status: alertStatusSchema,
    location: z.string(),
    daysAgo: z.number(),
    assignee: z.string().nullable(),
});

export type ApiAlert = z.infer<typeof apiAlertSchema>;
export type DashboardAlert = z.infer<typeof dashboardAlertSchema>;
export type AlertSite = z.infer<typeof alertSiteSchema>;
export type AlertCompound = z.infer<typeof alertCompoundSchema>;
export type AlertCell = z.infer<typeof alertCellSchema>;
export type AlertUser = z.infer<typeof alertUserSchema>;
export type AlertCommodity = z.infer<typeof alertCommoditySchema>;
