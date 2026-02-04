import fs from 'fs';
import path from 'path';
import { Logger } from '@nestjs/common';
import { TriggerEngineService } from './trigger-engine.service';
import { TriggerEvaluatorService } from './trigger-evaluator.service';
import { TriggerContextService } from './trigger-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from '../weather';

const NOW = new Date('2026-01-01T12:00:00.000Z');
const BASELINE_TIME = new Date('2026-01-01T06:00:00.000Z');

const loadExamples = (filename: string) => {
  // const filePath = path.join(__dirname, filename);
  // const raw = fs.readFileSync(filePath, 'utf8');
  // return JSON.parse(raw) as Array<any>;
};

const logEntries: Array<Record<string, unknown>> = [];
const logPath = path.join(
  __dirname,
  'temperature-condition-examples.log.json',
);

type Mocked<T> = {
  [K in keyof T]: jest.Mock;
};

const createMocks = () => {
  const prisma = {
    lookupTable: { findUnique: jest.fn() },
    sensorReading: { findMany: jest.fn() },
    gatewayReading: { findMany: jest.fn() },
    weatherObservation: { findMany: jest.fn() },
    site: { findUnique: jest.fn() },
    alert: { findFirst: jest.fn(), createMany: jest.fn() },
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

const baseScope = {
  siteId: 'site-1',
  cellId: 'cell-1',
  gatewayId: 'gateway-1',
  compoundId: 'compound-1',
  organizationId: 'org-1',
  commodityTypeId: undefined,
};

const buildTestData = (entry: any) => {
  const condition = entry.raw_condition ?? {};
  const sourceType = condition.sourceType ?? 'SENSOR';
  const type = condition.type ?? 'THRESHOLD';
  const testData = entry.test_data ?? {};

  const inputs: any = {
    gateway: { temperature: 22, humidity: 50, recordedAt: NOW },
    outside: { temperature: 33, humidity: 40, recordedAt: NOW },
    balls: [],
    sensorIdByExternal: new Map(),
    recordedAt: NOW,
  };

  const localHistory: any = {};

  if (Array.isArray(testData.currentBalls)) {
    inputs.balls = testData.currentBalls.map((ball: any) => ({
      id: ball.id,
      temperature: ball.temperature,
      humidity: ball.humidity ?? 50,
      recordedAt: NOW,
    }));
    inputs.sensorIdByExternal = new Map(
      testData.currentBalls.map((ball: any, index: number) => [
        ball.id,
        `sensor-${index + 1}`,
      ]),
    );
  }

  if (testData.gateway?.temperature !== undefined) {
    inputs.gateway = {
      temperature: testData.gateway.temperature,
      humidity: testData.gateway.humidity ?? 50,
      recordedAt: NOW,
    };
  }

  if (testData.outside?.temperature !== undefined) {
    inputs.outside = {
      temperature: testData.outside.temperature,
      humidity: testData.outside.humidity ?? 40,
      recordedAt: NOW,
    };
  }

  if (testData.current?.temperature !== undefined) {
    if (sourceType === 'GATEWAY') {
      inputs.gateway = {
        temperature: testData.current.temperature,
        humidity: testData.current.humidity ?? 50,
        recordedAt: NOW,
      };
    } else if (sourceType === 'OUTSIDE') {
      inputs.outside = {
        temperature: testData.current.temperature,
        humidity: testData.current.humidity ?? 40,
        recordedAt: NOW,
      };
    }
  }

  if (type === 'CHANGE') {
    if (sourceType === 'SENSOR' && Array.isArray(testData.baselineBalls)) {
      const baselineMap = new Map<string, any>();
      testData.baselineBalls.forEach((ball: any) => {
        baselineMap.set(ball.id, ball);
      });
      const history = new Map<string, any[]>();
      for (const [id, sensorId] of inputs.sensorIdByExternal.entries()) {
        const baseline = baselineMap.get(id);
        if (!baseline) {
          continue;
        }
        history.set(sensorId, [
          {
            temperature: baseline.temperature,
            humidity: baseline.humidity ?? 50,
            recordedAt: BASELINE_TIME,
          },
        ]);
      }
      localHistory.sensorHistoryById = history;
    } else if (
      sourceType === 'GATEWAY' &&
      testData.baseline?.temperature !== undefined
    ) {
      localHistory.gatewayHistory = [
        {
          temperature: testData.baseline.temperature,
          humidity: testData.baseline.humidity ?? 50,
          recordedAt: BASELINE_TIME,
        },
      ];
    } else if (
      sourceType === 'OUTSIDE' &&
      testData.baseline?.temperature !== undefined
    ) {
      localHistory.outsideHistory = [
        {
          temperature: testData.baseline.temperature,
          humidity: testData.baseline.humidity ?? 40,
          recordedAt: BASELINE_TIME,
        },
      ];
    }
  }

  return { inputs, localHistory };
};

beforeAll(() => {
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
});

afterAll(() => {
  fs.writeFileSync(logPath, JSON.stringify(logEntries, null, 2) + '\n');
});

describe('temperature-condition-examples.json', () => {
  const examples = loadExamples('temperature-condition-examples.json');

  test.each(examples)('$id', async (entry) => {
    const { prisma, triggerContext, weatherService } = createMocks();
    prisma.lookupTable.findUnique.mockResolvedValue(null);
    prisma.sensorReading.findMany.mockResolvedValue([]);
    prisma.gatewayReading.findMany.mockResolvedValue([]);
    prisma.weatherObservation.findMany.mockResolvedValue([]);
    prisma.site.findUnique.mockResolvedValue(null);

    const evaluator = new TriggerEvaluatorService();
    const engine = new TriggerEngineService(
      prisma,
      triggerContext,
      evaluator,
      weatherService,
    );

    const condition = {
      id: entry.id,
      ...entry.raw_condition,
    };

    triggerContext.findMatchingTriggers.mockResolvedValue([
      {
        id: 'trigger-1',
        name: 'Example Trigger',
        severity: 'MEDIUM',
        conditionLogic: 'AND',
        conditions: [condition],
      },
    ]);

    const { inputs, localHistory } = buildTestData(entry);

    const alertWriter = jest.fn();

    await engine.evaluateGatewayPayload(baseScope, inputs, {
      alertWriter,
      skipExistingCheck: true,
      persistAlerts: false,
      localHistory,
    });

    const expected = entry.result ?? entry.example?.result;
    const callCount = alertWriter.mock.calls.length;
    const isMatch = expected ? callCount === 1 : callCount === 0;

    const payload = {
      id: entry.id,
      human_readable: entry.human_readable,
      example: entry.example,
      expected,
      callCount,
      matched: isMatch,
      suite: 'true',
    };

    logEntries.push(payload);

    if (expected) {
      expect(alertWriter).toHaveBeenCalledTimes(1);
    } else {
      expect(alertWriter).not.toHaveBeenCalled();
    }
  });
});

describe('temperature-condition-examples-false.json', () => {
  const examples = loadExamples('temperature-condition-examples-false.json');

  test.each(examples)('$id', async (entry) => {
    const { prisma, triggerContext, weatherService } = createMocks();
    prisma.lookupTable.findUnique.mockResolvedValue(null);
    prisma.sensorReading.findMany.mockResolvedValue([]);
    prisma.gatewayReading.findMany.mockResolvedValue([]);
    prisma.weatherObservation.findMany.mockResolvedValue([]);
    prisma.site.findUnique.mockResolvedValue(null);

    const evaluator = new TriggerEvaluatorService();
    const engine = new TriggerEngineService(
      prisma,
      triggerContext,
      evaluator,
      weatherService,
    );

    const condition = {
      id: entry.id,
      ...entry.raw_condition,
    };

    triggerContext.findMatchingTriggers.mockResolvedValue([
      {
        id: 'trigger-1',
        name: 'Example Trigger',
        severity: 'MEDIUM',
        conditionLogic: 'AND',
        conditions: [condition],
      },
    ]);

    const { inputs, localHistory } = buildTestData(entry);

    const alertWriter = jest.fn();

    await engine.evaluateGatewayPayload(baseScope, inputs, {
      alertWriter,
      skipExistingCheck: true,
      persistAlerts: false,
      localHistory,
    });

    const expected = entry.result ?? entry.example?.result;
    const callCount = alertWriter.mock.calls.length;
    const isMatch = expected ? callCount === 1 : callCount === 0;

    const payload = {
      id: entry.id,
      human_readable: entry.human_readable,
      example: entry.example,
      expected,
      callCount,
      matched: isMatch,
      suite: 'false',
    };

    logEntries.push(payload);

    if (expected) {
      expect(alertWriter).toHaveBeenCalledTimes(1);
    } else {
      expect(alertWriter).not.toHaveBeenCalled();
    }
  });
});
