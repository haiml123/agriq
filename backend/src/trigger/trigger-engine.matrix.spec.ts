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

type TriggerShape = {
  id: string;
  name: string;
  severity: string;
  conditionLogic: ConditionLogic;
  conditions: any[];
};

type Scenario = {
  name: string;
  readings: Array<{
    recordedAt: Date;
    gateway: { temperature: number; humidity: number };
    outside: { temperature: number; humidity: number };
    balls: Array<{ id: string; temperature: number; humidity: number }>;
    histories?: {
      sensor?: Array<{
        sensorId: string;
        temperature: number;
        humidity: number;
        recordedAt: Date;
      }>;
      gateway?: Array<{
        temperature: number;
        humidity: number;
        recordedAt: Date;
      }>;
      outside?: Array<{
        temperature: number;
        humidity: number;
        recordedAt: Date;
      }>;
    };
  }>;
  triggers: TriggerShape[];
  expectedAlerts: Array<{
    triggerId: string;
    readingIndex: number;
  }>;
};

const NOW = new Date('2026-01-01T12:00:00.000Z');
const HOUR = 60 * 60 * 1000;

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

describe('TriggerEngineService matrix scenarios', () => {
  const scenarios: Scenario[] = [
    {
      name: 'sensor + gateway + outside thresholds',
      triggers: [
        buildTrigger({
          id: 't-sensor',
          name: 'Sensor temp above 25',
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
        }),
        buildTrigger({
          id: 't-gateway',
          name: 'Gateway humidity below 40',
          conditions: [
            {
              id: 'c1',
              metric: MetricType.HUMIDITY,
              type: ConditionType.THRESHOLD,
              operator: Operator.BELOW,
              value: 40,
              sourceType: ConditionSourceType.GATEWAY,
            },
          ],
        }),
        buildTrigger({
          id: 't-outside',
          name: 'Outside temp above 30',
          conditions: [
            {
              id: 'c1',
              metric: MetricType.TEMPERATURE,
              type: ConditionType.THRESHOLD,
              operator: Operator.ABOVE,
              value: 30,
              sourceType: ConditionSourceType.OUTSIDE,
            },
          ],
        }),
      ],
      readings: [
        {
          recordedAt: NOW,
          gateway: { temperature: 24, humidity: 35 },
          outside: { temperature: 32, humidity: 50 },
          balls: [
            { id: 'ball-1', temperature: 26, humidity: 50 },
            { id: 'ball-2', temperature: 24, humidity: 52 },
          ],
        },
        {
          recordedAt: new Date(NOW.getTime() + HOUR),
          gateway: { temperature: 24, humidity: 45 },
          outside: { temperature: 28, humidity: 50 },
          balls: [
            { id: 'ball-1', temperature: 24, humidity: 50 },
            { id: 'ball-2', temperature: 24, humidity: 52 },
          ],
        },
      ],
      expectedAlerts: [
        { triggerId: 't-sensor', readingIndex: 0 },
        { triggerId: 't-gateway', readingIndex: 0 },
        { triggerId: 't-outside', readingIndex: 0 },
      ],
    },
    {
      name: 'change over time + AND/OR',
      triggers: [
        buildTrigger({
          id: 't-change',
          name: 'Gateway temp increase 3',
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
        }),
        buildTrigger({
          id: 't-and',
          name: 'Temp above 25 AND humidity below 50',
          conditionLogic: ConditionLogic.AND,
          conditions: [
            {
              id: 'c1',
              metric: MetricType.TEMPERATURE,
              type: ConditionType.THRESHOLD,
              operator: Operator.ABOVE,
              value: 25,
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
        }),
        buildTrigger({
          id: 't-or',
          name: 'Temp above 30 OR humidity below 40',
          conditionLogic: ConditionLogic.OR,
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
              value: 40,
              sourceType: ConditionSourceType.GATEWAY,
            },
          ],
        }),
      ],
      readings: [
        {
          recordedAt: NOW,
          gateway: { temperature: 28, humidity: 45 },
          outside: { temperature: 20, humidity: 50 },
          balls: [
            { id: 'ball-1', temperature: 24, humidity: 50 },
            { id: 'ball-2', temperature: 25, humidity: 50 },
          ],
          histories: {
            gateway: [
              {
                temperature: 24,
                humidity: 45,
                recordedAt: new Date(NOW.getTime() - HOUR),
              },
            ],
          },
        },
      ],
      expectedAlerts: [
        { triggerId: 't-change', readingIndex: 0 },
        { triggerId: 't-and', readingIndex: 0 },
      ],
    },
    {
      name: 'median + between + outside change',
      triggers: [
        buildTrigger({
          id: 't-median',
          name: 'Median temp above 23',
          conditions: [
            {
              id: 'c1',
              metric: MetricType.MEDIAN_TEMPERATURE,
              type: ConditionType.THRESHOLD,
              operator: Operator.ABOVE,
              value: 22,
              sourceType: ConditionSourceType.SENSOR,
            },
          ],
        }),
        buildTrigger({
          id: 't-between',
          name: 'Outside humidity between 30-60',
          conditions: [
            {
              id: 'c1',
              metric: MetricType.HUMIDITY,
              type: ConditionType.THRESHOLD,
              operator: Operator.BETWEEN,
              value: 30,
              secondaryValue: 60,
              sourceType: ConditionSourceType.OUTSIDE,
            },
          ],
        }),
        buildTrigger({
          id: 't-outside-change',
          name: 'Outside humidity decrease 5',
          conditions: [
            {
              id: 'c1',
              metric: MetricType.HUMIDITY,
              type: ConditionType.CHANGE,
              changeDirection: ChangeDirection.DECREASE,
              changeAmount: 5,
              timeWindowHours: 2,
              sourceType: ConditionSourceType.OUTSIDE,
            },
          ],
        }),
      ],
      readings: [
        {
          recordedAt: NOW,
          gateway: { temperature: 24, humidity: 45 },
          outside: { temperature: 20, humidity: 40 },
          balls: [
            { id: 'ball-1', temperature: 22, humidity: 50 },
            { id: 'ball-2', temperature: 24, humidity: 50 },
          ],
          histories: {
            outside: [
              {
                temperature: 20,
                humidity: 50,
                recordedAt: new Date(NOW.getTime() - HOUR),
              },
            ],
          },
        },
      ],
      expectedAlerts: [
        { triggerId: 't-median', readingIndex: 0 },
        { triggerId: 't-between', readingIndex: 0 },
        { triggerId: 't-outside-change', readingIndex: 0 },
      ],
    },
  ];

  test.each(scenarios)('$name', async (scenario) => {
    const { prisma, triggerContext, weatherService } = createMocks();
    const evaluator = new TriggerEvaluatorService();
    const engine = new TriggerEngineService(
      prisma as unknown as PrismaService,
      triggerContext as unknown as TriggerContextService,
      evaluator,
      weatherService as unknown as WeatherService,
    );

    triggerContext.findMatchingTriggers.mockResolvedValue(scenario.triggers);

    const alerts: Array<{ triggerId: string; readingIndex: number }> = [];

    for (let i = 0; i < scenario.readings.length; i += 1) {
      const reading = scenario.readings[i];
      prisma.sensorReading.findMany.mockResolvedValue(
        reading.histories?.sensor ?? [],
      );
      prisma.gatewayReading.findMany.mockResolvedValue(
        reading.histories?.gateway ?? [],
      );
      prisma.weatherObservation.findMany.mockResolvedValue(
        reading.histories?.outside ?? [],
      );

      await engine.evaluateGatewayPayload(
        {
          siteId: 'site-1',
          cellId: 'cell-1',
          gatewayId: 'gateway-1',
          compoundId: 'compound-1',
        },
        {
          gateway: { ...reading.gateway, recordedAt: reading.recordedAt },
          outside: { ...reading.outside, recordedAt: reading.recordedAt },
          balls: reading.balls.map((ball) => ({
            ...ball,
            recordedAt: reading.recordedAt,
          })),
          sensorIdByExternal: new Map(
            reading.balls.map((ball, index) => [
              ball.id,
              `sensor-${index + 1}`,
            ]),
          ),
          recordedAt: reading.recordedAt,
        },
        {
          skipExistingCheck: true,
          alertWriter: (candidate) => {
            alerts.push({
              triggerId: candidate.triggerId,
              readingIndex: i,
            });
          },
        },
      );
    }

    expect(alerts).toEqual(scenario.expectedAlerts);
  });
});
