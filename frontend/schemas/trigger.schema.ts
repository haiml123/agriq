import { z } from 'zod'
import { CommunicationType, MetricSchema } from '@/schemas/common.schema';

export const ConditionTypeSchema = z.enum(["THRESHOLD", "CHANGE"])
export const OperatorSchema = z.enum(["ABOVE", "BELOW", "EQUALS", "BETWEEN"])
export const ChangeDirectionSchema = z.enum(["INCREASE", "DECREASE", "ANY"])
export const ConditionLogicSchema = z.enum(["AND", "OR"])
export const SeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
export const ActionTypeSchema = z.enum(["EMAIL", "SMS", "PUSH"])
export const ScopeTypeSchema = z.enum(["ALL", "ORGANIZATION", "SITE"])

export const ConditionTypeEnum = ConditionTypeSchema.enum;
export const OperatorEnum = OperatorSchema.enum;
export const ScopeTypeEnum = ScopeTypeSchema.enum;

// Commodity Type Schema - values will come from DB in production
export const CommodityTypeSchema = z.enum([
    "WHEAT",
    "CORN",
    "SOYBEANS",
    "BARLEY",
    "RICE",
    "OATS",
    "SORGHUM",
    "CANOLA",
    "SUNFLOWER",
    "OTHER",
])

// Mock commodity data - will be replaced with DB data in production
export const COMMODITY_OPTIONS = [
    { id: "wheat", value: "WHEAT", label: "Wheat" },
    { id: "corn", value: "CORN", label: "Corn" },
    { id: "soybeans", value: "SOYBEANS", label: "Soybeans" },
    { id: "barley", value: "BARLEY", label: "Barley" },
    { id: "rice", value: "RICE", label: "Rice" },
    { id: "oats", value: "OATS", label: "Oats" },
    { id: "sorghum", value: "SORGHUM", label: "Sorghum" },
    { id: "canola", value: "CANOLA", label: "Canola" },
    { id: "sunflower", value: "SUNFLOWER", label: "Sunflower Seeds" },
    { id: "other", value: "OTHER", label: "Other" },
] as const

// Condition Schema - matches Prisma JSON structure for conditions.items
export const ConditionSchema = z.object({
    id: z.string(),
    metric: MetricSchema,
    type: ConditionTypeSchema,
    operator: OperatorSchema.optional(),
    value: z.number().optional(),
    secondaryValue: z.number().optional(),
    changeDirection: ChangeDirectionSchema.optional(),
    changeAmount: z.number().optional(),
    timeWindowDays: z.number().optional(),
})

export const NotificationTemplateSchema = z.object({
    subject: z.string().optional(), // Only for email
    body: z.string(),
})

export const ActionSchema = z.object({
    type: ConditionTypeSchema,
    template: NotificationTemplateSchema.optional(),
    webhookUrl: z.string().url().optional(), // Only for WEBHOOK type
    recipients: z.array(z.string()).optional(), // User IDs for EMAIL/SMS
})

export const TriggerSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    isActive: z.boolean(),
    // Commodity type
    commodityType: CommodityTypeSchema.optional(),
    // Scope fields matching Prisma
    scopeType: ScopeTypeSchema,
    organizationId: z.string().optional(),
    siteId: z.string().optional(),
    compoundId: z.string().optional(),
    cellId: z.string().optional(),
    // Conditions stored as JSON in Prisma
    conditionLogic: ConditionLogicSchema,
    conditions: z.array(ConditionSchema).min(1, "At least one condition is required"),
    // Actions stored as JSON in Prisma
    actions: z.array(ActionSchema).min(1, "At least one action is required"),
    severity: SeveritySchema,
})

// Infer types from schemas
export type Metric = z.infer<typeof MetricSchema>
export type ConditionType = z.infer<typeof ConditionTypeSchema>
export type Operator = z.infer<typeof OperatorSchema>
export type ChangeDirection = z.infer<typeof ChangeDirectionSchema>
export type ConditionLogic = z.infer<typeof ConditionLogicSchema>
export type Severity = z.infer<typeof SeveritySchema>
export type ActionType = z.infer<typeof ActionTypeSchema>
export type ScopeType = z.infer<typeof ScopeTypeSchema>
export type CommodityType = z.infer<typeof CommodityTypeSchema>
export type Condition = z.infer<typeof ConditionSchema>
export type NotificationTemplate = z.infer<typeof NotificationTemplateSchema>
export type Action = z.infer<typeof ActionSchema>
export type Trigger = z.infer<typeof TriggerSchema>

export const TEMPLATE_VARIABLES = [
    { key: "{site_name}", description: "Name of the site" },
    { key: "{compound_name}", description: "Name of the compound" },
    { key: "{cell_name}", description: "Name of the cell" },
    { key: "{sensor_name}", description: "Name of the sensor" },
    { key: "{commodity_type}", description: "Type of commodity stored" },
    { key: "{metric}", description: "Metric type (Temperature/Humidity)" },
    { key: "{value}", description: "Current metric value" },
    { key: "{unit}", description: "Unit of measurement (°C or %)" },
    { key: "{threshold}", description: "Threshold value that was exceeded" },
    { key: "{severity}", description: "Alert severity level" },
    { key: "{timestamp}", description: "Time when alert was triggered" },
    { key: "{trigger_name}", description: "Name of this trigger" },
] as const

// Helper to create default condition
export const createDefaultCondition = (): Condition => ({
    id: Date.now().toString(),
    metric: "TEMPERATURE",
    type: "THRESHOLD",
    operator: "ABOVE",
    value: 30,
})

export const createDefaultAction = (type: CommunicationType): Action => ({
    type,
    template:
        type === "EMAIL"
            ? {
                subject: "Alert: {trigger_name} - {severity}",
                body: "A {severity} alert has been triggered.\n\nSite: {site_name}\nCommodity: {commodity_type}\nMetric: {metric}\nCurrent Value: {value}{unit}\nThreshold: {threshold}{unit}\nTime: {timestamp}",
            }
            : type === "SMS"
                ? { body: "Alert: {trigger_name} at {site_name}. {metric}: {value}{unit}. Severity: {severity}" }
                : undefined,
})

// Helper to create default trigger
export const createDefaultTrigger = (): Trigger => ({
    id: "",
    name: "",
    description: "",
    isActive: true,
    commodityType: undefined,
    scopeType: "ALL",
    organizationId: undefined,
    siteId: undefined,
    compoundId: undefined,
    cellId: undefined,
    conditionLogic: "AND",
    conditions: [createDefaultCondition()],
    actions: [createDefaultAction("EMAIL")],
    severity: "MEDIUM",
})

// Helper to get actions by type
export const hasActionType = (actions: Action[], type: ActionType): boolean => actions.some((a) => a.type === type)

export const getActionByType = (actions: Action[], type: ActionType): Action | undefined =>
    actions.find((a) => a.type === type)

// Helper to get commodity label
export const getCommodityLabel = (commodityType: CommodityType | undefined): string => {
    if (!commodityType) return "Any"
    const option = COMMODITY_OPTIONS.find((o) => o.value === commodityType)
    return option?.label ?? commodityType
}