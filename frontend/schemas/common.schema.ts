import { z } from 'zod'

export const communicationTypeSchema = z.enum(["EMAIL", "SMS", "PUSH"]);
export const metricSchema = z.enum(["TEMPERATURE", "HUMIDITY", "EMC"])
export const severitySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
export const alertStatusSchema = z.enum(['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']);
export const entityStatusSchema = z.enum(['ACTIVE', "PENDING", "BLOCKED", "DELETED"]);
export const roleTypeSchema = z.enum(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']);


export const CommunicationTypeEnum = communicationTypeSchema.enum;
export const MetricTypeEnum = metricSchema.enum;
export const SeverityEnum = severitySchema.enum;
export const AlertStatusEnum = alertStatusSchema.enum;
export const RoleTypeEnum = roleTypeSchema.enum;
export const EntityStatusEnum = entityStatusSchema.enum;

export type CommunicationType = z.infer<typeof communicationTypeSchema>
export type Severity = z.infer<typeof severitySchema>
export type EntityStatus = z.infer<typeof entityStatusSchema>
