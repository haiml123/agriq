import type {
  ChangeDirection,
  ConditionSourceType,
  ConditionType,
  MetricType,
  Operator,
  ValueSource,
} from './dto';

export type TriggerCondition = {
  id: string;
  metric: MetricType;
  type: ConditionType;
  operator?: Operator;
  value?: number;
  secondaryValue?: number;
  changeDirection?: ChangeDirection;
  changeAmount?: number;
  timeWindowHours?: number;
  valueSources?: ValueSource[];
  sourceType?: ConditionSourceType;
};

export interface TriggerContextScope {
  organizationId?: string;
  sensorId?: string;
  commodityTypeId?: string;
}

export type ReadingSource = 'GATEWAY' | 'SENSOR' | 'OUTSIDE';

export interface BaselineQuery {
  source: ReadingSource;
  sourceId: string;
  since: Date;
  before?: Date;
  metrics: MetricType[];
}

export interface TriggerEvaluationContext {
  metrics: Partial<Record<MetricType, number>>;
  previousMetrics?: Partial<Record<MetricType, number>>;
}

export interface TriggerEvaluationResult {
  matches: boolean;
  matchedConditions: string[];
  failedConditions: string[];
}

export type LookupTableData = {
  tempRanges: number[];
  humidityRanges: number[];
  values: number[][];
};

export type Reading = {
  temperature: number;
  humidity: number;
  recordedAt: Date;
};
export type BallReading = Reading & { id: string; macId?: string };

export type TriggerScope = {
  organizationId?: string;
  commodityTypeId?: string;
  siteId?: string;
  compoundId?: string;
  cellId?: string;
  sensorId?: string;
  gatewayId?: string;
};

export type EvaluationInputs = {
  gateway?: Reading;
  outside?: Reading;
  balls?: BallReading[];
  sensorIdByExternal?: Map<string, string>;
  recordedAt: Date;
};

export type SourceWindow = {
  sensorHours: number;
  gatewayHours: number;
  outsideHours: number;
};

export type HistoryCache = {
  sensorHistoryById: Map<string, Reading[]>;
  gatewayHistory: Reading[];
  outsideHistory: Reading[];
};

export type LocalHistory = Partial<{
  sensorHistoryById: Map<string, Reading[]>;
  gatewayHistory: Reading[];
  outsideHistory: Reading[];
}>;

export type AlertCandidate = {
  triggerId: string;
  siteId: string;
  compoundId?: string | null;
  cellId?: string | null;
  sensorId?: string | null;
  organizationId?: string | null;
  title: string;
  description: string;
  descriptionKey: string;
  descriptionParams: Record<string, unknown>;
  severity: string;
  thresholdValue?: number;
  unit?: string;
};

export type AlertWriter = (candidate: AlertCandidate) => Promise<void> | void;
