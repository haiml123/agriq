import { z } from 'zod';
import { entityStatusSchema } from '@/schemas/common.schema';

// ============ CELL SCHEMAS ============

export const createCellSchema = z.object({
  name: z.string().min(1).max(100),
  compoundId: z.string(),
  capacity: z.number().min(0),
  status: entityStatusSchema.optional(),
});

export const updateCellSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  capacity: z.number().min(0).optional(),
  status: entityStatusSchema.optional(),
});


export const cellSchema = z.object({
  id: z.string(),
  status: entityStatusSchema,
  name: z.string(),
  capacity: z.number(),
  temp: z.number().nullable().optional(),
  humidity: z.number().nullable().optional(),
  compoundId: z.string(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Relations
  // sensors: z.array(z.lazy(() => sensorSchema)).optional(),
  // alerts: z.array(z.lazy(() => alertSchema)).optional(),
  // readings: z.array(z.lazy(() => sensorReadingSchema)).optional(),
  // trades: z.array(z.lazy(() => tradeSchema)).optional(),
});

// ============ COMPOUND SCHEMAS ============

export const compoundSchema = z.object({
  id: z.string(),
  name: z.string(),
  siteId: z.string(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),

  cells: z.array(cellSchema).optional(),
  // alerts: z.array(z.lazy(() => alertSchema)).optional(),
  // trades: z.array(z.lazy(() => tradeSchema)).optional(),
});

export const createCompoundSchema = z.object({
  name: z.string().min(1).max(100),
  siteId: z.string().optional(),
  status: entityStatusSchema.optional(),
});

export const updateCompoundSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: entityStatusSchema.optional(),
});

// ============ SITE SCHEMAS ============

export const siteSchema = z.object({
  id: z.string(),
  name: z.string(),
  organizationId: z.string(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  createdBy: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Relations
  compounds: z.array(compoundSchema).optional(),
  // alerts: z.array(z.lazy(() => alertSchema)).optional(),
  // trades: z.array(z.lazy(() => tradeSchema)).optional(),
  // triggers: z.array(z.lazy(() => eventTriggerSchema)).optional(),
});

export const createSiteSchema = z.object({
  name: z.string().min(1).max(100),
  organizationId: z.string().optional(),
  address: z.string().max(255).optional(),
});

export const updateSiteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(255).optional(),
  organizationId: z.string().optional(),
});

export const siteListParamsSchema = z.object({
  organizationId: z.string().optional(),
});

// ============ TYPES ============
export type Cell = z.infer<typeof cellSchema>;
export type CreateCellDto = z.infer<typeof createCellSchema>;
export type UpdateCellDto = z.infer<typeof updateCellSchema>;

export type Compound = z.infer<typeof compoundSchema>;
export type CreateCompoundDto = z.infer<typeof createCompoundSchema>;
export type UpdateCompoundDto = z.infer<typeof updateCompoundSchema>;

export type Site = z.infer<typeof siteSchema>;
export type CreateSiteDto = z.infer<typeof createSiteSchema>;
export type UpdateSiteDto = z.infer<typeof updateSiteSchema>;
export type SiteListParams = z.infer<typeof siteListParamsSchema>;

