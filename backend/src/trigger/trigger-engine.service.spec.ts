import { TriggerEngineService } from './trigger-engine.service';
import { TriggerEvaluatorService } from './trigger-evaluator.service';
import { TriggerContextService } from './trigger-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather';
import {
  ChangeDirection,
  ConditionLogic,
  ConditionSourceType,
  ConditionType,
  MetricType,
  Operator,
  ValueSource,
} from './dto';

type Mocked<T> = {
  [K in keyof T]: jest.Mock;
};

type TriggerShape = {
  id: string;
  name: string;
  severity: string;
  conditionLogic: ConditionLogic;
  conditions: any[];
};

const NOW = new Date('2026-01-01T12:00:00.000Z');

const createMocks = () => {
  const prisma = {
    lookupTable: { findUnique: jest.fn() },
    sensorReading: { findMany: jest.fn() },
    gatewayReading: { findMany: jest.fn() },
    weatherObservation: { findMany: jest.fn() },
    alert: { findFirst: jest.fn(), create: jest.fn() },
  } as unknown as Mocked<PrismaService>;

  const triggerContext = {
    findMatchingTriggers: jest.fn(),
    getChangeMetricWindows: jest.fn(),
    loadBaselineMetrics: jest.fn(),
  } as unknown as Mocked<TriggerContextService>;

  const weatherService = {
    getCurrentObservationForSite: jest.fn(),
    ensureWeatherObservationsForRange: jest.fn(),
  } as unknown as Mocked<WeatherService>;

  return { prisma, triggerContext, weatherService };
};

const buildTrigger = (partial: Partial<TriggerShape>): TriggerShape => ({
  id: partial.id ?? 'trigger-1',
  name: partial.name ?? 'Trigger 1',
  severity: partial.severity ?? 'MEDIUM',
  conditionLogic: partial.conditionLogic ?? ConditionLogic.AND,
  conditions: partial.conditions ?? [],
});

const defaultScope = {
  siteId: 'site-1',
  cellId: 'cell-1',
  gatewayId: 'gateway-1',
  compoundId: 'compound-1',
  organizationId: 'org-1',
};

const baseInputs = {
  gateway: { temperature: 25, humidity: 50, recordedAt: NOW },
  outside: { temperature: 20, humidity: 40, recordedAt: NOW },
  balls: [
    { id: 'ball-1', temperature: 22, humidity: 48, recordedAt: NOW },
    { id: 'ball-2', temperature: 24, humidity: 52, recordedAt: NOW },
  ],
  sensorIdByExternal: new Map([
    ['ball-1', 'sensor-1'],
    ['ball-2', 'sensor-2'],
  ]),
  recordedAt: NOW,
};

const setSensorHistory = (
  prisma: Mocked<PrismaService>,
  values: Array<{ temperature: number; humidity?: number }>,
) => {
  prisma.sensorReading.findMany.mockResolvedValue(
    values.map((value, index) => ({
      sensorId: index === 0 ? 'sensor-1' : 'sensor-2',
      temperature: value.temperature,
      humidity: value.humidity ?? 50,
      recordedAt: new Date(NOW.getTime() - 60 * 60 * 1000),
    })),
  );
};

const setGatewayHistory = (
  prisma: Mocked<PrismaService>,
  data: { temperature: number; humidity?: number },
) => {
  prisma.gatewayReading.findMany.mockResolvedValue([
    {
      temperature: data.temperature,
      humidity: data.humidity ?? 50,
      recordedAt: new Date(NOW.getTime() - 60 * 60 * 1000),
    },
  ]);
};

const setOutsideHistory = (prisma: Mocked<PrismaService>, humidity: number) => {
  prisma.weatherObservation.findMany.mockResolvedValue([
    {
      temperature: 20,
      humidity,
      recordedAt: new Date(NOW.getTime() - 60 * 60 * 1000),
    },
  ]);
};

const runGatewayCase = async (params: {
  condition: any;
  logic?: ConditionLogic;
  inputs?: Partial<typeof baseInputs>;
  scope?: Partial<typeof defaultScope>;
  setup?: (mocks: ReturnType<typeof createMocks>) => void;
}) => {
  const mocks = createMocks();
  const { prisma, triggerContext, weatherService } = mocks;
  const evaluator = new TriggerEvaluatorService();
  const evalSpy = jest.spyOn(evaluator, 'evaluateConditionForValue');
  const engine = new TriggerEngineService(
    prisma as unknown as PrismaService,
    triggerContext as unknown as TriggerContextService,
    evaluator,
    weatherService as unknown as WeatherService,
  );

  const trigger = buildTrigger({
    conditionLogic: params.logic ?? ConditionLogic.AND,
    conditions: [params.condition],
  });

  triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
  prisma.lookupTable.findUnique.mockResolvedValue(null);
  prisma.sensorReading.findMany.mockResolvedValue([]);
  prisma.gatewayReading.findMany.mockResolvedValue([]);
  prisma.weatherObservation.findMany.mockResolvedValue([]);

  if (params.setup) {
    params.setup(mocks);
  }

  const alerts: any[] = [];
  await engine.evaluateGatewayPayload(
    { ...defaultScope, ...(params.scope ?? {}) },
    { ...baseInputs, ...(params.inputs ?? {}) },
    {
      skipExistingCheck: true,
      alertWriter: (candidate) => alerts.push(candidate),
    },
  );

  return { alerts, evalCalls: evalSpy.mock.calls };
};

const expectAlertBasics = (alert: any) => {
  expect(alert).toBeTruthy();
  expect(alert.triggerId).toBeDefined();
  expect(alert.title).toBeDefined();
  expect(alert.descriptionKey).toBe('alert.description.triggerMatched');
  expect(alert.descriptionParams).toBeTruthy();
  expect(alert.siteId).toBe(defaultScope.siteId);
  expect(alert.cellId).toBe(defaultScope.cellId);
  expect(alert.organizationId).toBe(defaultScope.organizationId);
};

const extractConditions = (alert: any) => {
  const params = alert.descriptionParams as { conditions?: any[] };
  return Array.isArray(params?.conditions) ? params.conditions : [];
};

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const getExpectedCurrentValues = (
  condition: any,
  inputs: Partial<typeof baseInputs>,
  lookupTable?: { tempRanges: number[]; humidityRanges: number[]; values: number[][] },
) => {
  const balls = inputs.balls ?? baseInputs.balls;
  const gateway = inputs.gateway ?? baseInputs.gateway;
  const outside = inputs.outside ?? baseInputs.outside;

  if (condition.metric === MetricType.MEDIAN_TEMPERATURE) {
    return [median(balls.map((ball) => ball.temperature))];
  }
  if (condition.metric === MetricType.MEDIAN_HUMIDITY) {
    return [median(balls.map((ball) => ball.humidity))];
  }
  if (condition.metric === MetricType.EMC && lookupTable) {
    const calc = (temperature: number, humidity: number) => {
      const tempIndex = lookupTable.tempRanges.reduce(
        (idx, value, i) => (temperature >= value ? i : idx),
        0,
      );
      const humidityIndex = lookupTable.humidityRanges.reduce(
        (idx, value, i) => (humidity >= value ? i : idx),
        0,
      );
      return lookupTable.values[humidityIndex]?.[tempIndex];
    };
    return balls
      .map((ball) => calc(ball.temperature, ball.humidity))
      .filter((value) => value !== undefined) as number[];
  }

  if (condition.sourceType === ConditionSourceType.SENSOR) {
    return condition.metric === MetricType.HUMIDITY
      ? balls.map((ball) => ball.humidity)
      : balls.map((ball) => ball.temperature);
  }

  if (condition.sourceType === ConditionSourceType.GATEWAY) {
    return [
      condition.metric === MetricType.HUMIDITY
        ? gateway?.humidity ?? 0
        : gateway?.temperature ?? 0,
    ];
  }

  if (condition.sourceType === ConditionSourceType.OUTSIDE) {
    return [
      condition.metric === MetricType.HUMIDITY
        ? outside?.humidity ?? 0
        : outside?.temperature ?? 0,
    ];
  }

  if (Array.isArray(condition.valueSources)) {
    const values: number[] = [];
    condition.valueSources.forEach((source: ValueSource) => {
      if (source === ValueSource.GATEWAY) {
        values.push(
          condition.metric === MetricType.HUMIDITY
            ? gateway?.humidity ?? 0
            : gateway?.temperature ?? 0,
        );
      }
      if (source === ValueSource.OUTSIDE) {
        values.push(
          condition.metric === MetricType.HUMIDITY
            ? outside?.humidity ?? 0
            : outside?.temperature ?? 0,
        );
      }
    });
    return values;
  }

  return [];
};

const expectEvalCurrentIn = (evalCalls: any[], conditionId: string, expected: number[]) => {
  const calls = evalCalls.filter((call) => call[0]?.id === conditionId);
  expect(calls.length).toBeGreaterThan(0);
  const currents = calls.map((call) => call[1]);
  const hit = currents.some((value) => expected.some((exp) => Math.abs(exp - value) < 1e-6));
  expect(hit).toBe(true);
};

const expectEvalPreviousIn = (
  evalCalls: any[],
  conditionId: string,
  metric: MetricType,
  expected: number[],
) => {
  const calls = evalCalls.filter((call) => call[0]?.id === conditionId);
  expect(calls.length).toBeGreaterThan(0);
  const previousValues = calls
    .map((call) => call[2]?.[metric])
    .filter((value) => value !== undefined);
  const hit = previousValues.some((value) =>
    expected.some((exp) => Math.abs(exp - value) < 1e-6),
  );
  expect(hit).toBe(true);
};

describe('TriggerEngineService - comprehensive coverage', () => {
  const describeCondition = (condition: any) => {
    const metric = condition.metric ?? 'UNKNOWN_METRIC';
    const source =
      condition.sourceType ??
      (Array.isArray(condition.valueSources)
        ? `sources=${condition.valueSources.join('+')}`
        : 'SENSOR');

    if (condition.type === ConditionType.THRESHOLD) {
      if (condition.operator === Operator.BETWEEN) {
        return `${source} ${metric} BETWEEN ${condition.value}..${condition.secondaryValue}`;
      }
      return `${source} ${metric} ${condition.operator ?? 'OP'} ${condition.value}`;
    }

    if (condition.type === ConditionType.CHANGE) {
      return `${source} ${metric} CHANGE ${condition.changeDirection ?? 'ANY'} ${condition.changeAmount ?? 0} in ${condition.timeWindowHours ?? 1}h`;
    }

    return `${source} ${metric} ${condition.type ?? 'UNKNOWN'}`;
  };

  const rawThresholdCases = [
    {
      name: 'sensor ABOVE match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 21,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 1,
    },
    {
      name: 'sensor ABOVE no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 30,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 0,
    },
    {
      name: 'sensor BELOW match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 60,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 1,
    },
    {
      name: 'sensor BELOW no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 40,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 0,
    },
    {
      name: 'sensor EQUALS match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.EQUALS,
        value: 24,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 1,
    },
    {
      name: 'sensor EQUALS no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.EQUALS,
        value: 30,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 0,
    },
    {
      name: 'sensor BETWEEN match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.BETWEEN,
        value: 20,
        secondaryValue: 26,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 1,
    },
    {
      name: 'sensor BETWEEN no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.BETWEEN,
        value: 30,
        secondaryValue: 32,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 0,
    },
    {
      name: 'gateway ABOVE match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 24,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 1,
    },
    {
      name: 'gateway ABOVE no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 30,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 0,
    },
    {
      name: 'gateway BELOW match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 60,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 1,
    },
    {
      name: 'gateway BELOW no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 40,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 0,
    },
    {
      name: 'gateway EQUALS match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.EQUALS,
        value: 25,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 1,
    },
    {
      name: 'gateway EQUALS no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.EQUALS,
        value: 26,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 0,
    },
    {
      name: 'gateway BETWEEN match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.BETWEEN,
        value: 20,
        secondaryValue: 26,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 1,
    },
    {
      name: 'gateway BETWEEN no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.BETWEEN,
        value: 28,
        secondaryValue: 30,
        sourceType: ConditionSourceType.GATEWAY,
      },
      expected: 0,
    },
    {
      name: 'outside ABOVE match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 19,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 1,
    },
    {
      name: 'outside ABOVE no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 30,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 0,
    },
    {
      name: 'outside BELOW match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 50,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 1,
    },
    {
      name: 'outside BELOW no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 30,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 0,
    },
    {
      name: 'outside EQUALS match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.EQUALS,
        value: 20,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 1,
    },
    {
      name: 'outside EQUALS no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.EQUALS,
        value: 21,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 0,
    },
    {
      name: 'outside BETWEEN match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.BETWEEN,
        value: 15,
        secondaryValue: 25,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 1,
    },
    {
      name: 'outside BETWEEN no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.BETWEEN,
        value: 25,
        secondaryValue: 30,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      expected: 0,
    },
  ];

  const thresholdCases = rawThresholdCases.map((item) => ({
    ...item,
    name: `${describeCondition(item.condition)} => ${item.expected ? 'MATCH' : 'NO MATCH'}`,
  }));

test.each(thresholdCases)('$name', async ({ condition, expected }) => {
    const { alerts, evalCalls } = await runGatewayCase({ condition });
    expect(alerts.length).toBe(expected);
    if (expected > 0) {
      expectAlertBasics(alerts[0]);
      const [cond] = extractConditions(alerts[0]);
      expect(cond.metric).toBe(condition.metric);
      expect(cond.type).toBe(condition.type);
      expect(cond.operator).toBe(condition.operator);
      expect(cond.value).toBe(condition.value);
      if (condition.operator === Operator.BETWEEN) {
        expect(cond.secondaryValue).toBe(condition.secondaryValue);
      }
      const expectedCurrents = getExpectedCurrentValues(condition, {});
      expectEvalCurrentIn(evalCalls, condition.id, expectedCurrents);
    }
  });

  const rawChangeCases = [
    {
      name: 'sensor CHANGE increase match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.INCREASE,
        changeAmount: 2,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setSensorHistory(mocks.prisma, [
          { temperature: 18 },
          { temperature: 19 },
        ]),
      expectedPrevious: [18, 19],
      expected: 1,
    },
    {
      name: 'sensor CHANGE increase no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.INCREASE,
        changeAmount: 5,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setSensorHistory(mocks.prisma, [
          { temperature: 21 },
          { temperature: 22 },
        ]),
      expectedPrevious: [21, 22],
      expected: 0,
    },
    {
      name: 'sensor CHANGE decrease match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.DECREASE,
        changeAmount: 4,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setSensorHistory(mocks.prisma, [
          { temperature: 20, humidity: 60 },
          { temperature: 20, humidity: 60 },
        ]),
      inputs: {
        balls: [
          { id: 'ball-1', temperature: 22, humidity: 50, recordedAt: NOW },
          { id: 'ball-2', temperature: 24, humidity: 50, recordedAt: NOW },
        ],
      },
      expectedPrevious: [60, 60],
      expected: 1,
    },
    {
      name: 'sensor CHANGE decrease no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.DECREASE,
        changeAmount: 10,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setSensorHistory(mocks.prisma, [
          { temperature: 20, humidity: 55 },
          { temperature: 20, humidity: 55 },
        ]),
      inputs: {
        balls: [
          { id: 'ball-1', temperature: 22, humidity: 50, recordedAt: NOW },
          { id: 'ball-2', temperature: 24, humidity: 50, recordedAt: NOW },
        ],
      },
      expectedPrevious: [55, 55],
      expected: 0,
    },
    {
      name: 'sensor CHANGE any match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.ANY,
        changeAmount: 2,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setSensorHistory(mocks.prisma, [
          { temperature: 26 },
          { temperature: 27 },
        ]),
      expectedPrevious: [26, 27],
      expected: 1,
    },
    {
      name: 'sensor CHANGE any no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.ANY,
        changeAmount: 5,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setSensorHistory(mocks.prisma, [
          { temperature: 23 },
          { temperature: 24 },
        ]),
      expectedPrevious: [23, 24],
      expected: 0,
    },
    {
      name: 'gateway CHANGE increase match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.INCREASE,
        changeAmount: 3,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.GATEWAY,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setGatewayHistory(mocks.prisma, { temperature: 20 }),
      inputs: { gateway: { temperature: 25, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [20],
      expected: 1,
    },
    {
      name: 'gateway CHANGE increase no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.INCREASE,
        changeAmount: 6,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.GATEWAY,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setGatewayHistory(mocks.prisma, { temperature: 23 }),
      inputs: { gateway: { temperature: 25, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [23],
      expected: 0,
    },
    {
      name: 'gateway CHANGE decrease match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.DECREASE,
        changeAmount: 5,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.GATEWAY,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setGatewayHistory(mocks.prisma, { temperature: 25, humidity: 25 }),
      inputs: { gateway: { temperature: 25, humidity: 18, recordedAt: NOW } },
      expectedPrevious: [25],
      expected: 1,
    },
    {
      name: 'gateway CHANGE decrease no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.DECREASE,
        changeAmount: 10,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.GATEWAY,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setGatewayHistory(mocks.prisma, { temperature: 25, humidity: 25 }),
      inputs: { gateway: { temperature: 25, humidity: 20, recordedAt: NOW } },
      expectedPrevious: [25],
      expected: 0,
    },
    {
      name: 'gateway CHANGE any match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.ANY,
        changeAmount: 2,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.GATEWAY,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setGatewayHistory(mocks.prisma, { temperature: 28 }),
      inputs: { gateway: { temperature: 25, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [28],
      expected: 1,
    },
    {
      name: 'gateway CHANGE any no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.ANY,
        changeAmount: 5,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.GATEWAY,
      },
      setup: (mocks: ReturnType<typeof createMocks>) =>
        setGatewayHistory(mocks.prisma, { temperature: 28 }),
      inputs: { gateway: { temperature: 25, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [28],
      expected: 0,
    },
    {
      name: 'outside CHANGE increase match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.INCREASE,
        changeAmount: 5,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => setOutsideHistory(mocks.prisma, 40),
      inputs: { outside: { temperature: 20, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [40],
      expected: 1,
    },
    {
      name: 'outside CHANGE increase no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.INCREASE,
        changeAmount: 15,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => setOutsideHistory(mocks.prisma, 40),
      inputs: { outside: { temperature: 20, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [40],
      expected: 0,
    },
    {
      name: 'outside CHANGE decrease match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.DECREASE,
        changeAmount: 5,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => setOutsideHistory(mocks.prisma, 60),
      inputs: { outside: { temperature: 20, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [60],
      expected: 1,
    },
    {
      name: 'outside CHANGE decrease no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.DECREASE,
        changeAmount: 15,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => setOutsideHistory(mocks.prisma, 60),
      inputs: { outside: { temperature: 20, humidity: 50, recordedAt: NOW } },
      expectedPrevious: [60],
      expected: 0,
    },
    {
      name: 'outside CHANGE any match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.ANY,
        changeAmount: 5,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => setOutsideHistory(mocks.prisma, 30),
      inputs: { outside: { temperature: 20, humidity: 40, recordedAt: NOW } },
      expectedPrevious: [30],
      expected: 1,
    },
    {
      name: 'outside CHANGE any no match',
      condition: {
        id: 'c1',
        metric: MetricType.HUMIDITY,
        type: ConditionType.CHANGE,
        changeDirection: ChangeDirection.ANY,
        changeAmount: 15,
        timeWindowHours: 2,
        sourceType: ConditionSourceType.OUTSIDE,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => setOutsideHistory(mocks.prisma, 30),
      inputs: { outside: { temperature: 20, humidity: 40, recordedAt: NOW } },
      expectedPrevious: [30],
      expected: 0,
    },
  ];

  const changeCases = rawChangeCases.map((item) => ({
    ...item,
    name: `${describeCondition(item.condition)} => ${item.expected ? 'MATCH' : 'NO MATCH'}`,
  }));

test.each(changeCases)('$name', async ({ condition, setup, inputs, expected, expectedPrevious }) => {
    const { alerts, evalCalls } = await runGatewayCase({ condition, setup, inputs });
    expect(alerts.length).toBe(expected);
    if (expected > 0) {
      expectAlertBasics(alerts[0]);
      const [cond] = extractConditions(alerts[0]);
      expect(cond.metric).toBe(condition.metric);
      expect(cond.type).toBe(condition.type);
      expect(cond.changeDirection).toBe(condition.changeDirection);
      expect(cond.changeAmount).toBe(condition.changeAmount);
      expect(cond.timeWindowHours).toBe(condition.timeWindowHours);
      const expectedCurrents = getExpectedCurrentValues(condition, inputs ?? {});
      expectEvalCurrentIn(evalCalls, condition.id, expectedCurrents);
      if (expectedPrevious) {
        expectEvalPreviousIn(evalCalls, condition.id, condition.metric, expectedPrevious);
      }
    }
  });

  const rawMedianCases = [
    {
      name: 'median temperature threshold match',
      condition: {
        id: 'c1',
        metric: MetricType.MEDIAN_TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 22,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 1,
    },
    {
      name: 'median temperature threshold no match',
      condition: {
        id: 'c1',
        metric: MetricType.MEDIAN_TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 30,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 0,
    },
    {
      name: 'median humidity threshold match',
      condition: {
        id: 'c1',
        metric: MetricType.MEDIAN_HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 60,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 1,
    },
    {
      name: 'median humidity threshold no match',
      condition: {
        id: 'c1',
        metric: MetricType.MEDIAN_HUMIDITY,
        type: ConditionType.THRESHOLD,
        operator: Operator.BELOW,
        value: 40,
        sourceType: ConditionSourceType.SENSOR,
      },
      expected: 0,
    },
  ];

  const medianCases = rawMedianCases.map((item) => ({
    ...item,
    name: `${describeCondition(item.condition)} => ${item.expected ? 'MATCH' : 'NO MATCH'}`,
  }));

test.each(medianCases)('$name', async ({ condition, expected }) => {
    const { alerts, evalCalls } = await runGatewayCase({ condition });
    expect(alerts.length).toBe(expected);
    if (expected > 0) {
      expectAlertBasics(alerts[0]);
      const [cond] = extractConditions(alerts[0]);
      expect(cond.metric).toBe(condition.metric);
      expect(cond.operator).toBe(condition.operator);
      const matchCall = evalCalls.find((call) => call[0]?.id === condition.id);
      const currentValue = matchCall?.[1];
      if (condition.metric === MetricType.MEDIAN_TEMPERATURE) {
        expect(currentValue).toBeCloseTo(23, 5);
      }
      if (condition.metric === MetricType.MEDIAN_HUMIDITY) {
        expect(currentValue).toBeCloseTo(50, 5);
      }
    }
  });

  const rawEmcCases = [
    {
      name: 'EMC threshold match',
      condition: {
        id: 'c1',
        metric: MetricType.EMC,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 14,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => {
        mocks.prisma.lookupTable.findUnique.mockResolvedValue({
          data: {
            tempRanges: [0, 20, 40],
            humidityRanges: [0, 50, 100],
            values: [
              [8, 10, 12],
              [12, 15, 18],
              [14, 17, 20],
            ],
          },
        });
      },
      inputs: {
        balls: [
          { id: 'ball-1', temperature: 30, humidity: 60, recordedAt: NOW },
        ],
      },
      scope: { commodityTypeId: 'commodity-1' },
      expected: 1,
    },
    {
      name: 'EMC threshold no match',
      condition: {
        id: 'c1',
        metric: MetricType.EMC,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 20,
        sourceType: ConditionSourceType.SENSOR,
      },
      setup: (mocks: ReturnType<typeof createMocks>) => {
        mocks.prisma.lookupTable.findUnique.mockResolvedValue({
          data: {
            tempRanges: [0, 20, 40],
            humidityRanges: [0, 50, 100],
            values: [
              [8, 10, 12],
              [12, 15, 18],
              [14, 17, 20],
            ],
          },
        });
      },
      inputs: {
        balls: [
          { id: 'ball-1', temperature: 20, humidity: 55, recordedAt: NOW },
        ],
      },
      scope: { commodityTypeId: 'commodity-1' },
      expected: 0,
    },
  ];

  const emcCases = rawEmcCases.map((item) => ({
    ...item,
    name: `${describeCondition(item.condition)} => ${item.expected ? 'MATCH' : 'NO MATCH'}`,
  }));

test.each(emcCases)('$name', async ({ condition, setup, inputs, scope, expected }) => {
    const lookupTable = {
      tempRanges: [0, 20, 40],
      humidityRanges: [0, 50, 100],
      values: [
        [8, 10, 12],
        [12, 15, 18],
        [14, 17, 20],
      ],
    };
    const { alerts, evalCalls } = await runGatewayCase({ condition, setup, inputs, scope });
    expect(alerts.length).toBe(expected);
    if (expected > 0) {
      expectAlertBasics(alerts[0]);
      expect(alerts[0].thresholdValue).toBe(condition.value);
      expect(alerts[0].unit).toBe('%');
      const [cond] = extractConditions(alerts[0]);
      expect(cond.metric).toBe(condition.metric);
      const matchCall = evalCalls.find((call) => call[0]?.id === condition.id);
      const currentValue = matchCall?.[1];
      expect(currentValue).toBeCloseTo(15, 5);
      const expectedCurrents = getExpectedCurrentValues(
        condition,
        inputs ?? {},
        lookupTable,
      );
      expectEvalCurrentIn(evalCalls, condition.id, expectedCurrents);
    }
  });

  const logicCases = [
    {
      name: 'GATEWAY TEMP ABOVE 30 AND HUMIDITY ABOVE 40 => NO MATCH',
      logic: ConditionLogic.AND,
      conditions: [
        {
          id: 'c1',
          metric: MetricType.TEMPERATURE,
          type: ConditionType.THRESHOLD,
          operator: Operator.ABOVE,
          value: 30,
          sourceType: ConditionSourceType.GATEWAY,
        },
        {
          id: 'c2',
          metric: MetricType.HUMIDITY,
          type: ConditionType.THRESHOLD,
          operator: Operator.ABOVE,
          value: 40,
          sourceType: ConditionSourceType.GATEWAY,
        },
      ],
      expected: 0,
    },
    {
      name: 'GATEWAY TEMP ABOVE 30 OR HUMIDITY BELOW 60 => MATCH',
      logic: ConditionLogic.OR,
      conditions: [
        {
          id: 'c1',
          metric: MetricType.TEMPERATURE,
          type: ConditionType.THRESHOLD,
          operator: Operator.ABOVE,
          value: 30,
          sourceType: ConditionSourceType.GATEWAY,
        },
        {
          id: 'c2',
          metric: MetricType.HUMIDITY,
          type: ConditionType.THRESHOLD,
          operator: Operator.BELOW,
          value: 60,
          sourceType: ConditionSourceType.GATEWAY,
        },
      ],
      expected: 1,
    },
  ];

  test.each(logicCases)('$name', async ({ logic, conditions, expected }) => {
    const mocks = createMocks();
    const { prisma, triggerContext, weatherService } = mocks;
    const evaluator = new TriggerEvaluatorService();
    const engine = new TriggerEngineService(
      prisma as unknown as PrismaService,
      triggerContext as unknown as TriggerContextService,
      evaluator,
      weatherService as unknown as WeatherService,
    );

    const trigger = buildTrigger({
      conditionLogic: logic,
      conditions,
    });

    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
    prisma.sensorReading.findMany.mockResolvedValue([]);
    prisma.gatewayReading.findMany.mockResolvedValue([]);
    prisma.weatherObservation.findMany.mockResolvedValue([]);

    const alerts: any[] = [];
    await engine.evaluateGatewayPayload(
      { ...defaultScope },
      { ...baseInputs },
      {
        skipExistingCheck: true,
        alertWriter: (candidate) => alerts.push(candidate),
      },
    );

    expect(alerts.length).toBe(expected);
    if (expected > 0) {
      expectAlertBasics(alerts[0]);
      const conds = extractConditions(alerts[0]);
      expect(conds.length).toBeGreaterThan(0);
    }
  });

  const rawValueSourceCases = [
    {
      name: 'valueSources gateway match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 24,
        valueSources: [ValueSource.GATEWAY, ValueSource.OUTSIDE],
      },
      expected: 1,
    },
    {
      name: 'valueSources outside match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 19,
        valueSources: [ValueSource.OUTSIDE, ValueSource.GATEWAY],
      },
      expected: 1,
    },
    {
      name: 'valueSources no match',
      condition: {
        id: 'c1',
        metric: MetricType.TEMPERATURE,
        type: ConditionType.THRESHOLD,
        operator: Operator.ABOVE,
        value: 30,
        valueSources: [ValueSource.OUTSIDE, ValueSource.GATEWAY],
      },
      expected: 0,
    },
  ];

  const valueSourceCases = rawValueSourceCases.map((item) => ({
    ...item,
    name: `${describeCondition(item.condition)} => ${item.expected ? 'MATCH' : 'NO MATCH'}`,
  }));

test.each(valueSourceCases)('$name', async ({ condition, expected }) => {
    const { alerts, evalCalls } = await runGatewayCase({ condition });
    expect(alerts.length).toBe(expected);
    if (expected > 0) {
      expectAlertBasics(alerts[0]);
      const [cond] = extractConditions(alerts[0]);
      expect(cond.metric).toBe(condition.metric);
      expect(cond.valueSources).toEqual(condition.valueSources);
      const expectedCurrents = getExpectedCurrentValues(condition, {});
      expectEvalCurrentIn(evalCalls, condition.id, expectedCurrents);
    }
  });

  it('computes median temperature correctly (current value)', async () => {
    const condition = {
      id: 'c1',
      metric: MetricType.MEDIAN_TEMPERATURE,
      type: ConditionType.THRESHOLD,
      operator: Operator.ABOVE,
      value: 10,
      sourceType: ConditionSourceType.SENSOR,
    };
    const inputs = {
      balls: [
        { id: 'ball-1', temperature: 22, humidity: 40, recordedAt: NOW },
        { id: 'ball-2', temperature: 24, humidity: 40, recordedAt: NOW },
      ],
    };
    const { evalCalls } = await runGatewayCase({ condition, inputs });
    const matchCall = evalCalls.find((call) => call[0]?.id === condition.id);
    const currentValue = matchCall?.[1];
    expect(currentValue).toBeCloseTo(23, 5);
  });

  it('computes EMC value from lookup table', async () => {
    const condition = {
      id: 'c1',
      metric: MetricType.EMC,
      type: ConditionType.THRESHOLD,
      operator: Operator.ABOVE,
      value: 10,
      sourceType: ConditionSourceType.SENSOR,
    };
    const setup = (mocks: ReturnType<typeof createMocks>) => {
      mocks.prisma.lookupTable.findUnique.mockResolvedValue({
        data: {
          tempRanges: [0, 20, 40],
          humidityRanges: [0, 50, 100],
          values: [
            [8, 10, 12],
            [12, 15, 18],
            [14, 17, 20],
          ],
        },
      });
    };
    const inputs = {
      balls: [{ id: 'ball-1', temperature: 30, humidity: 60, recordedAt: NOW }],
    };
    const scope = { commodityTypeId: 'commodity-1' };
    const { evalCalls } = await runGatewayCase({ condition, setup, inputs, scope });
    const matchCall = evalCalls.find((call) => call[0]?.id === condition.id);
    const currentValue = matchCall?.[1];
    expect(currentValue).toBeCloseTo(15, 5);
  });

  it('uses baseline value for gateway change-over-time', async () => {
    const condition = {
      id: 'c1',
      metric: MetricType.TEMPERATURE,
      type: ConditionType.CHANGE,
      changeDirection: ChangeDirection.INCREASE,
      changeAmount: 1,
      timeWindowHours: 2,
      sourceType: ConditionSourceType.GATEWAY,
    };
    const setup = (mocks: ReturnType<typeof createMocks>) =>
      setGatewayHistory(mocks.prisma, { temperature: 20 });
    const inputs = { gateway: { temperature: 25, humidity: 50, recordedAt: NOW } };
    const { evalCalls } = await runGatewayCase({ condition, setup, inputs });
    const matchCall = evalCalls.find((call) => call[0]?.id === condition.id);
    const previousMetrics = matchCall?.[2] ?? {};
    expect(previousMetrics[MetricType.TEMPERATURE]).toBe(20);
  });

  it('evaluateSensorReading creates alert with scope and description', async () => {
    const mocks = createMocks();
    const { prisma, triggerContext, weatherService } = mocks;
    const evaluator = new TriggerEvaluatorService();
    const engine = new TriggerEngineService(
      prisma as unknown as PrismaService,
      triggerContext as unknown as TriggerContextService,
      evaluator,
      weatherService as unknown as WeatherService,
    );

    const trigger = buildTrigger({
      conditions: [
        {
          id: 'c1',
          metric: MetricType.TEMPERATURE,
          type: ConditionType.THRESHOLD,
          operator: Operator.ABOVE,
          value: 20,
          sourceType: ConditionSourceType.SENSOR,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
    triggerContext.getChangeMetricWindows.mockReturnValue(new Map());
    prisma.alert.findFirst.mockResolvedValue(null);
    prisma.alert.create.mockResolvedValue({ id: 'alert-1' });

    await engine.evaluateSensorReading(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        sensorId: 'sensor-1',
        organizationId: 'org-1',
        commodityTypeId: 'commodity-1',
      },
      { temperature: 25, humidity: 40, recordedAt: NOW },
    );

    expect(prisma.alert.create).toHaveBeenCalledTimes(1);
    const call = prisma.alert.create.mock.calls[0][0];
    expect(call.data.siteId).toBe('site-1');
    expect(call.data.cellId).toBe('cell-1');
    expect(call.data.sensorId).toBe('sensor-1');
    expect(call.data.organizationId).toBe('org-1');
    expect(call.data.descriptionKey).toBe('alert.description.triggerMatched');
  });

  it('evaluateSensorReading change-over-time uses baseline metrics', async () => {
    const mocks = createMocks();
    const { prisma, triggerContext, weatherService } = mocks;
    const evaluator = new TriggerEvaluatorService();
    const engine = new TriggerEngineService(
      prisma as unknown as PrismaService,
      triggerContext as unknown as TriggerContextService,
      evaluator,
      weatherService as unknown as WeatherService,
    );

    const trigger = buildTrigger({
      conditions: [
        {
          id: 'c1',
          metric: MetricType.TEMPERATURE,
          type: ConditionType.CHANGE,
          changeDirection: ChangeDirection.INCREASE,
          changeAmount: 3,
          timeWindowHours: 2,
          sourceType: ConditionSourceType.SENSOR,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
    triggerContext.getChangeMetricWindows.mockReturnValue(
      new Map([[MetricType.TEMPERATURE, 2]]),
    );
    triggerContext.loadBaselineMetrics.mockResolvedValue({
      [MetricType.TEMPERATURE]: 20,
    });

    prisma.alert.findFirst.mockResolvedValue(null);
    prisma.alert.create.mockResolvedValue({ id: 'alert-1' });

    await engine.evaluateSensorReading(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        sensorId: 'sensor-1',
        organizationId: 'org-1',
        commodityTypeId: 'commodity-1',
      },
      { temperature: 24, humidity: 40, recordedAt: NOW },
    );

    expect(prisma.alert.create).toHaveBeenCalledTimes(1);
  });
});
