import { z } from 'zod';
import { entityStatusSchema, severitySchema, alertStatusSchema } from '@/schemas/common.schema';
import { tradeCommoditySchema } from '@/schemas/trade.schema';

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

// ============ SENSOR SCHEMAS ============

export const gatewaySchema = z.object({
  id: z.string(),
  externalId: z.string(),
  name: z.string().nullable().optional(),
  status: entityStatusSchema,
  cellId: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  cell: z.object({
    id: z.string(),
    name: z.string(),
    compound: z.object({
      id: z.string(),
      name: z.string(),
      site: z.object({
        id: z.string(),
        name: z.string(),
      }),
    }),
  }).optional(),
});

export const createGatewaySchema = z.object({
  cellId: z.string(),
  name: z.string().optional(),
  externalId: z.string().optional(),
  status: entityStatusSchema.optional(),
});

export const updateGatewaySchema = z.object({
  name: z.string().optional(),
  status: entityStatusSchema.optional(),
});

export const sensorSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  name: z.string().nullable().optional(),
  status: entityStatusSchema,
  gatewayId: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  gateway: gatewaySchema.optional(),
});

export const createSensorSchema = z.object({
  gatewayId: z.string(),
  name: z.string().optional(),
  externalId: z.string().optional(),
  status: entityStatusSchema.optional(),
});

export const transferSensorSchema = z.object({
  gatewayId: z.string(),
});

export const createSensorReadingSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  batteryPercent: z.number().min(0).max(100),
  recordedAt: z.string(),
});

export const createSensorReadingsBatchSchema = z.object({
  readings: z.array(createSensorReadingSchema).min(1),
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
export type Gateway = z.infer<typeof gatewaySchema>;
export type CreateGatewayDto = z.infer<typeof createGatewaySchema>;
export type UpdateGatewayDto = z.infer<typeof updateGatewaySchema>;
export type Sensor = z.infer<typeof sensorSchema>;
export type CreateSensorDto = z.infer<typeof createSensorSchema>;
export type TransferSensorDto = z.infer<typeof transferSensorSchema>;
export type CreateSensorReadingDto = z.infer<typeof createSensorReadingSchema>;
export type CreateSensorReadingsBatchDto = z.infer<typeof createSensorReadingsBatchSchema>;

// ============ SENSOR READING SCHEMAS ============

export const sensorReadingSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  gatewayId: z.string(),
  sensorId: z.string(),
  temperature: z.number(),
  humidity: z.number(),
  batteryPercent: z.number(),
  recordedAt: z.string(),
});

// ============ TRADE FOR CELL DETAILS ============

export const cellTradeSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  amountKg: z.number(),
  tradedAt: z.string(),
  commodity: tradeCommoditySchema,
});

// ============ ALERT FOR CELL DETAILS ============

export const cellAlertSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  title: z.string().nullable(),
  description: z.string(),
  severity: severitySchema,
  status: alertStatusSchema,
  thresholdValue: z.number().nullable(),
  unit: z.string().nullable(),
  startedAt: z.string(),
});

// ============ CELL DETAILS SCHEMAS ============

export const cellWithDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  compound: z.object({
    id: z.string(),
    name: z.string(),
    site: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
});

export const cellDetailsSchema = z.object({
  cell: cellWithDetailsSchema,
  sensorReadings: z.array(sensorReadingSchema),
  trades: z.array(cellTradeSchema),
  alerts: z.array(cellAlertSchema),
});

export const multipleCellsDetailsSchema = z.object({
  cells: z.array(cellWithDetailsSchema),
  sensorReadings: z.array(sensorReadingSchema),
  trades: z.array(cellTradeSchema),
  alerts: z.array(cellAlertSchema),
});

// ============ DATE RANGE ============

export const dateRangeSchema = z.enum(['7days', 'month', 'year', 'custom']);
export const DateRangeEnum = dateRangeSchema.enum;

// ============ CHART DATA SCHEMAS ============

export const chartDataPointSchema = z.object({
  date: z.string(),
  fullDate: z.string(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  commodity: z.string(),
});

export const commodityMarkerSchema = z.object({
  date: z.string(),
  fullDate: z.string(),
  commodity: z.string(),
  color: z.string(),
});

export const cellChartDataSchema = z.object({
  temperatureData: z.array(chartDataPointSchema),
  humidityData: z.array(chartDataPointSchema),
  tempMin: z.number(),
  tempMax: z.number(),
  humidityMin: z.number(),
  humidityMax: z.number(),
  trades: z.array(cellTradeSchema),
  alerts: z.array(cellAlertSchema),
  commodityMarkers: z.array(commodityMarkerSchema),
});

// ============ ADDITIONAL TYPES ============

export type SensorReading = z.infer<typeof sensorReadingSchema>;
export type CellTrade = z.infer<typeof cellTradeSchema>;
export type CellAlert = z.infer<typeof cellAlertSchema>;
export type CellWithDetails = z.infer<typeof cellWithDetailsSchema>;
export type CellDetails = z.infer<typeof cellDetailsSchema>;
export type MultipleCellsDetails = z.infer<typeof multipleCellsDetailsSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type ChartDataPoint = z.infer<typeof chartDataPointSchema>;
export type CommodityMarker = z.infer<typeof commodityMarkerSchema>;
export type CellChartData = z.infer<typeof cellChartDataSchema>;
