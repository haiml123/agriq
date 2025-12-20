import { z } from 'zod';

// Nested schemas for related entities
export const tradeSiteSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const tradeCompoundSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const tradeCellSchema = z.object({
    id: z.string(),
    name: z.string(),
});

export const tradeCommoditySchema = z.object({
    id: z.string(),
    name: z.string(),
    origin: z.string().optional(),
});

// Main trade schema from API
export const apiTradeSchema = z.object({
    id: z.string(),
    amountKg: z.number(),
    tradedAt: z.string(),
    notes: z.string().optional(),
    commodity: tradeCommoditySchema.optional(),
    site: tradeSiteSchema.optional(),
    compound: tradeCompoundSchema.optional(),
    cell: tradeCellSchema.optional(),
});

// Dashboard trade schema (formatted for display)
export const dashboardTradeSchema = z.object({
    id: z.string(),
    name: z.string(),
    origin: z.string(),
    quantity: z.string(),
    location: z.string(),
    date: z.string(),
});

export type ApiTrade = z.infer<typeof apiTradeSchema>;
export type DashboardTrade = z.infer<typeof dashboardTradeSchema>;
export type TradeSite = z.infer<typeof tradeSiteSchema>;
export type TradeCompound = z.infer<typeof tradeCompoundSchema>;
export type TradeCell = z.infer<typeof tradeCellSchema>;
export type TradeCommodity = z.infer<typeof tradeCommoditySchema>;
