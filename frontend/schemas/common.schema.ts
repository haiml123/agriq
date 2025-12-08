import { z } from 'zod'

export const CommunicationTypeSchema = z.enum(["EMAIL", "SMS", "PUSH"]);
export const MetricSchema = z.enum(["TEMPERATURE", "HUMIDITY", "EMC"])
export const SeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])






export const CommunicationTypeEnum = CommunicationTypeSchema.enum;
export const MetricTypeEnum = MetricSchema.enum;
export const SeverityEnum = SeveritySchema.enum;

export type CommunicationType = z.infer<typeof CommunicationTypeSchema>
export type MetricType = z.infer<typeof MetricSchema>
export type Severity = z.infer<typeof MetricSchema>