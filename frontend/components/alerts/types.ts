// Re-export types from Zod schemas (single source of truth)
export type { ApiAlert } from '@/schemas/alert.schema';
export { SeverityEnum, AlertStatusEnum } from '@/schemas/common.schema';

// Filter types
export type StatusFilter = 'all' | Array<AlertStatusEnum.OPEN | AlertStatusEnum.ACKNOWLEDGED>;
export type SeverityFilter = 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TimeFilter = 'all' | '24h' | '7d' | '30d' | '90d';
