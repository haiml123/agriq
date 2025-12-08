import { z } from 'zod'
import { CommunicationType, metricSchema, severitySchema } from '@/schemas/common.schema';

export const conditionTypeSchema = z.enum(["THRESHOLD", "CHANGE"])
export const operatorSchema = z.enum(["ABOVE", "BELOW", "EQUALS", "BETWEEN"])
export const changeDirectionSchema = z.enum(["INCREASE", "DECREASE", "ANY"])
export const conditionLogicSchema = z.enum(["AND", "OR"])
export const actionTypeSchema = z.enum(["EMAIL", "SMS", "PUSH"])
export const scopeTypeSchema = z.enum(["ALL", "ORGANIZATION", "SITE"])

export const ConditionTypeEnum = conditionTypeSchema.enum;
export const OperatorEnum = operatorSchema.enum;
export const ScopeTypeEnum = scopeTypeSchema.enum;

// Commodity Type Schema - values will come from DB in production
export const commodityTypeSchema = z.enum([
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
export const conditionSchema = z.object({
    id: z.string(),
    metric: metricSchema,
    type: conditionTypeSchema,
    operator: operatorSchema.optional(),
    value: z.number().optional(),
    secondaryValue: z.number().optional(),
    changeDirection: changeDirectionSchema.optional(),
    changeAmount: z.number().optional(),
    timeWindowDays: z.number().optional(),
})

export const notificationTemplateSchema = z.object({
    subject: z.string().optional(), // Only for email
    body: z.string(),
})

export const actionSchema = z.object({
    type: conditionTypeSchema,
    template: notificationTemplateSchema.optional(),
    webhookUrl: z.string().url().optional(), // Only for WEBHOOK type
    recipients: z.array(z.string()).optional(), // User IDs for EMAIL/SMS
})

export const triggerSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    isActive: z.boolean(),
    // Commodity type
    commodityType: commodityTypeSchema.optional(),
    // Scope fields matching Prisma
    scopeType: scopeTypeSchema,
    organizationId: z.string().optional(),
    siteId: z.string().optional(),
    compoundId: z.string().optional(),
    cellId: z.string().optional(),
    // Conditions stored as JSON in Prisma
    conditionLogic: conditionLogicSchema,
    conditions: z.array(conditionSchema).min(1, "At least one condition is required"),
    // Actions stored as JSON in Prisma
    actions: z.array(actionSchema).min(1, "At least one action is required"),
    severity: severitySchema,
})

// Infer types from schemas
export type ConditionType = z.infer<typeof conditionTypeSchema>
export type Operator = z.infer<typeof operatorSchema>
export type ChangeDirection = z.infer<typeof changeDirectionSchema>
export type ConditionLogic = z.infer<typeof conditionLogicSchema>
export type ActionType = z.infer<typeof actionTypeSchema>
export type ScopeType = z.infer<typeof scopeTypeSchema>
export type CommodityType = z.infer<typeof commodityTypeSchema>
export type Condition = z.infer<typeof conditionSchema>
export type NotificationTemplate = z.infer<typeof notificationTemplateSchema>
export type Action = z.infer<typeof actionSchema>
export type Trigger = z.infer<typeof triggerSchema>

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