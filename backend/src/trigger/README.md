# Trigger Engine Test Coverage

This folder includes a comprehensive unit test suite for the trigger engine logic.

## End-to-end flow (high level)

1. Receive new readings from a gateway:
   - Gateway device payloads: `GatewayService.ingestGatewayPayloadFromDevice`.
   - Simulator payloads: `GatewaySimulatorService.createGatewayReadingsBatch`
     or `GatewaySimulatorService.simulateGatewayReadingsBatch`.
2. Normalize and persist readings:
   - Normalize + create ball sensors: `GatewayService.normalizeBallReadings`,
     `GatewayService.ensureSensorsForBalls`.
   - Persist gateway + sensor readings: `GatewayService.persistGatewayAndSensorReadings`.
3. Resolve trigger scope:
   - Load active triggers for scope: `TriggerContextService.findMatchingTriggers`.
4. Prepare evaluation inputs:
   - Build current metric snapshot: `TriggerEngineService.evaluateGatewayPayload`.
   - Load lookup table (EMC): `TriggerEngineService.getLookupTable`.
   - Compute max history windows: `TriggerEngineService.getMaxWindows`.
   - Load histories: `TriggerEngineService.loadHistories`.
5. Evaluate triggers:
   - Gateway + balls + outside: `TriggerEngineService.evaluateGatewayPayload`.
   - Condition evaluation: `TriggerEvaluatorService.evaluateTrigger`.
6. Create alerts:
   - Build alert description payload: `TriggerEngineService.buildAlertDescriptionPayload`.
   - Deduplicate open alerts: `TriggerEngineService.ensureAlertForTrigger`.
   - Persist alert or return via `alertWriter` (simulator).

## How to run

```bash
npm test -- trigger-engine.service.spec.ts
npm test -- trigger-engine.matrix.spec.ts
```

## What is covered

The test suite validates that the trigger engine produces correct alert candidates
for all supported condition types and source combinations. All assertions check
the computed values in the alert payload, not just counts.

In addition, a matrix test suite validates multi-trigger/multi-reading flows.

### Coverage matrix (55 cases)

- Thresholds (ABOVE, BELOW, EQUALS, BETWEEN)
  - SENSOR: match + no match
  - GATEWAY: match + no match
  - OUTSIDE: match + no match

- Change over time (INCREASE, DECREASE, ANY)
  - SENSOR: match + no match
  - GATEWAY: match + no match
  - OUTSIDE: match + no match

- Median metrics
  - MEDIAN_TEMPERATURE threshold (match + no match)
  - MEDIAN_HUMIDITY threshold (match + no match)

- EMC
  - Threshold match + no match with lookup table
  - Unit and threshold value asserted

- Logic
  - AND fails if one condition fails
  - OR matches if one condition passes

- Value sources
  - valueSources = [GATEWAY, OUTSIDE] (gateway match)
  - valueSources = [OUTSIDE, GATEWAY] (outside match)
  - no match across sources


## Assertions

Each passing case validates:
- alert candidate fields (triggerId, siteId, cellId, organizationId)
- descriptionKey and descriptionParams
- condition fields (metric, operator/changeDirection, values)
- thresholdValue/unit where applicable

Additional numeric assertions:
- current metric values passed to evaluator for all threshold cases
- previous/baseline values for all change-over-time cases
- median temperature calculation (current value)
- EMC calculation via lookup table (current value)
- gateway change-over-time baseline value used in evaluation

## Notes

- All tests use mocked Prisma + Weather services.
- Alert persistence is not exercised; alert candidates are captured via the
  engine alertWriter hook.
- The matrix suite uses a compact list of triggers + readings + expected alerts
  to verify behavior across multiple readings in sequence.
