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
} from './dto';

type Mocked<T> = {
  [K in keyof T]: jest.Mock;
};

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

const buildTrigger = (partial: any) => ({
  id: partial.id ?? 'trigger-1',
  name: partial.name ?? 'Trigger 1',
  severity: partial.severity ?? 'MEDIUM',
  conditionLogic: partial.conditionLogic ?? ConditionLogic.AND,
  conditions: partial.conditions ?? [],
});

describe('TriggerEngineService', () => {
  let prisma: Mocked<PrismaService>;
  let triggerContext: Mocked<TriggerContextService>;
  let weatherService: Mocked<WeatherService>;
  let evaluator: TriggerEvaluatorService;
  let engine: TriggerEngineService;

  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = createMocks();
    prisma = mocks.prisma;
    triggerContext = mocks.triggerContext;
    weatherService = mocks.weatherService;
    evaluator = new TriggerEvaluatorService();
    engine = new TriggerEngineService(
      prisma as unknown as PrismaService,
      triggerContext as unknown as TriggerContextService,
      evaluator,
      weatherService as unknown as WeatherService,
    );
  });

  it('emits alert for sensor threshold condition (balls)', async () => {
    const trigger = buildTrigger({
      conditions: [
        {
          id: 'c1',
          metric: MetricType.TEMPERATURE,
          type: ConditionType.THRESHOLD,
          operator: Operator.ABOVE,
          value: 25,
          sourceType: ConditionSourceType.SENSOR,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);

    const alerts: any[] = [];
    await engine.evaluateGatewayPayload(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        gatewayId: 'gateway-1',
        compoundId: 'compound-1',
      },
      {
        gateway: { temperature: 20, humidity: 40, recordedAt: new Date() },
        balls: [
          {
            id: 'ball-1',
            temperature: 26,
            humidity: 45,
            recordedAt: new Date(),
          },
        ],
        sensorIdByExternal: new Map(),
        recordedAt: new Date(),
      },
      {
        skipExistingCheck: true,
        alertWriter: (candidate) => alerts.push(candidate),
      },
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0].triggerId).toBe('trigger-1');
    expect(alerts[0].siteId).toBe('site-1');
    expect(alerts[0].cellId).toBe('cell-1');
    expect(alerts[0].compoundId).toBe('compound-1');
    expect(prisma.alert.create).not.toHaveBeenCalled();
  });

  it('matches sensor median change over time', async () => {
    const now = new Date();
    const baseline = new Date(now.getTime() - 30 * 60 * 1000);

    const trigger = buildTrigger({
      conditions: [
        {
          id: 'c1',
          metric: MetricType.MEDIAN_TEMPERATURE,
          type: ConditionType.CHANGE,
          changeDirection: ChangeDirection.INCREASE,
          changeAmount: 2,
          timeWindowHours: 1,
          sourceType: ConditionSourceType.SENSOR,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
    prisma.sensorReading.findMany.mockResolvedValue([
      { sensorId: 's1', temperature: 18, humidity: 40, recordedAt: baseline },
      { sensorId: 's2', temperature: 19, humidity: 42, recordedAt: baseline },
    ]);

    const alerts: any[] = [];
    await engine.evaluateGatewayPayload(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        gatewayId: 'gateway-1',
      },
      {
        gateway: { temperature: 20, humidity: 40, recordedAt: now },
        balls: [
          { id: 'ball-1', temperature: 21, humidity: 40, recordedAt: now },
          { id: 'ball-2', temperature: 22, humidity: 40, recordedAt: now },
        ],
        sensorIdByExternal: new Map([
          ['ball-1', 's1'],
          ['ball-2', 's2'],
        ]),
        recordedAt: now,
      },
      {
        skipExistingCheck: true,
        alertWriter: (candidate) => alerts.push(candidate),
      },
    );

    expect(alerts).toHaveLength(1);
  });

  it('matches gateway change over time', async () => {
    const now = new Date();
    const baseline = new Date(now.getTime() - 60 * 60 * 1000);

    const trigger = buildTrigger({
      conditions: [
        {
          id: 'c1',
          metric: MetricType.TEMPERATURE,
          type: ConditionType.CHANGE,
          changeDirection: ChangeDirection.INCREASE,
          changeAmount: 3,
          timeWindowHours: 2,
          sourceType: ConditionSourceType.GATEWAY,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
    prisma.gatewayReading.findMany.mockResolvedValue([
      { temperature: 20, humidity: 40, recordedAt: baseline },
    ]);

    const alerts: any[] = [];
    await engine.evaluateGatewayPayload(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        gatewayId: 'gateway-1',
      },
      {
        gateway: { temperature: 24, humidity: 40, recordedAt: now },
        balls: [],
        sensorIdByExternal: new Map(),
        recordedAt: now,
      },
      {
        skipExistingCheck: true,
        alertWriter: (candidate) => alerts.push(candidate),
      },
    );

    expect(alerts).toHaveLength(1);
  });

  it('matches outside change over time', async () => {
    const now = new Date();
    const baseline = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const trigger = buildTrigger({
      conditions: [
        {
          id: 'c1',
          metric: MetricType.HUMIDITY,
          type: ConditionType.CHANGE,
          changeDirection: ChangeDirection.DECREASE,
          changeAmount: 5,
          timeWindowHours: 3,
          sourceType: ConditionSourceType.OUTSIDE,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
    prisma.weatherObservation.findMany.mockResolvedValue([
      { temperature: 25, humidity: 60, recordedAt: baseline },
    ]);

    const alerts: any[] = [];
    await engine.evaluateGatewayPayload(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        gatewayId: 'gateway-1',
      },
      {
        gateway: { temperature: 24, humidity: 40, recordedAt: now },
        outside: { temperature: 26, humidity: 50, recordedAt: now },
        balls: [],
        sensorIdByExternal: new Map(),
        recordedAt: now,
      },
      {
        skipExistingCheck: true,
        alertWriter: (candidate) => alerts.push(candidate),
      },
    );

    expect(alerts).toHaveLength(1);
  });

  it('matches EMC threshold using lookup table', async () => {
    const now = new Date();
    const trigger = buildTrigger({
      conditions: [
        {
          id: 'c1',
          metric: MetricType.EMC,
          type: ConditionType.THRESHOLD,
          operator: Operator.ABOVE,
          value: 14,
          sourceType: ConditionSourceType.SENSOR,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);
    prisma.lookupTable.findUnique.mockResolvedValue({
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

    const alerts: any[] = [];
    await engine.evaluateGatewayPayload(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        gatewayId: 'gateway-1',
        commodityTypeId: 'commodity-1',
      },
      {
        gateway: { temperature: 25, humidity: 40, recordedAt: now },
        balls: [
          { id: 'ball-1', temperature: 30, humidity: 60, recordedAt: now },
        ],
        sensorIdByExternal: new Map(),
        recordedAt: now,
      },
      {
        skipExistingCheck: true,
        alertWriter: (candidate) => alerts.push(candidate),
      },
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0].thresholdValue).toBe(14);
    expect(alerts[0].unit).toBe('%');
  });

  it('matches OR condition when one condition passes', async () => {
    const now = new Date();
    const trigger = buildTrigger({
      conditionLogic: ConditionLogic.OR,
      conditions: [
        {
          id: 'c1',
          metric: MetricType.TEMPERATURE,
          type: ConditionType.THRESHOLD,
          operator: Operator.ABOVE,
          value: 40,
          sourceType: ConditionSourceType.GATEWAY,
        },
        {
          id: 'c2',
          metric: MetricType.HUMIDITY,
          type: ConditionType.THRESHOLD,
          operator: Operator.BELOW,
          value: 50,
          sourceType: ConditionSourceType.GATEWAY,
        },
      ],
    });
    triggerContext.findMatchingTriggers.mockResolvedValue([trigger]);

    const alerts: any[] = [];
    await engine.evaluateGatewayPayload(
      {
        siteId: 'site-1',
        cellId: 'cell-1',
        gatewayId: 'gateway-1',
      },
      {
        gateway: { temperature: 35, humidity: 45, recordedAt: now },
        balls: [],
        sensorIdByExternal: new Map(),
        recordedAt: now,
      },
      {
        skipExistingCheck: true,
        alertWriter: (candidate) => alerts.push(candidate),
      },
    );

    expect(alerts).toHaveLength(1);
  });

  it('evaluateSensorReading creates alert with scope', async () => {
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
      { temperature: 25, humidity: 40, recordedAt: new Date() },
    );

    expect(prisma.alert.create).toHaveBeenCalledTimes(1);
    const call = prisma.alert.create.mock.calls[0][0];
    expect(call.data.siteId).toBe('site-1');
    expect(call.data.cellId).toBe('cell-1');
    expect(call.data.sensorId).toBe('sensor-1');
    expect(call.data.organizationId).toBe('org-1');
    expect(call.data.descriptionKey).toBe('alert.description.triggerMatched');
  });
});
