'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks';
import { useGatewayApi } from '@/hooks/use-gateway-api';
import { useTriggerApi } from '@/hooks/use-trigger-api';
import type {
  CreateGatewayReadingDto,
  GatewayBallReadingDto,
  Gateway,
  Sensor,
  SimulatedAlert,
} from '@/schemas/sites.schema';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { resolveLocaleText } from '@/utils/locale';
import { OrganizationSelect } from '@/components/select/organization-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSeverityColor } from '@/components/alerts/utils/alert-utils';

type GatewayOption = {
  id: string;
  label: string;
};

const formatDateTimeLocal = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${date.getFullYear()}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultStartAt = () => formatDateTimeLocal(new Date());

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return {
    start: formatDateTimeLocal(start),
    end: formatDateTimeLocal(end),
  };
};

const buildCellLabel = (site: string, compound: string, cell: string) =>
  `${site} / ${compound} / ${cell}`;

const buildSensorLabel = (sensor: Sensor) => {
  if (sensor.name && sensor.name.trim().length > 0) {
    return `${sensor.name} (${sensor.externalId})`;
  }
  return sensor.externalId;
};

const buildGatewayLabel = (gateway: Gateway, locale: string) => {
  const baseLabel =
    gateway.name && gateway.name.trim().length > 0 ? gateway.name : gateway.externalId;
  const cellLabel = gateway.cell?.compound?.site?.name && gateway.cell?.compound?.name
    ? buildCellLabel(
        resolveLocaleText(gateway.cell.compound.site?.locale, locale, gateway.cell.compound.site.name),
        resolveLocaleText(gateway.cell.compound?.locale, locale, gateway.cell.compound.name),
        resolveLocaleText(gateway.cell?.locale, locale, gateway.cell.name),
      )
    : gateway.cell
      ? resolveLocaleText(gateway.cell?.locale, locale, gateway.cell.name)
      : undefined;
  return cellLabel ? `${baseLabel} - ${cellLabel}` : baseLabel;
};

export function SimulatorPage() {
  const t = useTranslations('simulator');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast.simulator');
  const tSeverity = useTranslations('severity');
  const tAlertDescription = useTranslations('alertDescription');
  const tAlertCondition = useTranslations('alertCondition');
  const tAlertWindow = useTranslations('alertWindow');
  const tMetric = useTranslations('alertMetric');
  const tOperator = useTranslations('alertOperator');
  const tDirection = useTranslations('alertDirection');
  const locale = useLocale();
  const router = useRouter();
  const { user, isSuperAdmin, isLoading: isCurrentUserLoading } = useCurrentUser();
  const {
    getGateways,
    getSensors,
    createSensor,
    transferSensor,
    simulateGatewayReadingsBatch,
    getGatewayReadingsRange,
    clearGatewayReadingsRange,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
  } = useGatewayApi();
  const { getList: getTriggers } = useTriggerApi();

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [createGatewayId, setCreateGatewayId] = useState('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('all');
  const [createName, setCreateName] = useState('');
  const [createExternalId, setCreateExternalId] = useState('');
  const [transferSensorId, setTransferSensorId] = useState('');
  const [transferGatewayId, setTransferGatewayId] = useState('');
  const [batchGatewayId, setBatchGatewayId] = useState('');
  const batchCount = 24;
  const [batchStartAt, setBatchStartAt] = useState(getDefaultStartAt());
  const [batchIntervalHours, setBatchIntervalHours] = useState(1);
  const [batchBaseTemperature, setBatchBaseTemperature] = useState(20);
  const [batchTemperatureVariance, setBatchTemperatureVariance] = useState(2);
  const [batchBaseHumidity, setBatchBaseHumidity] = useState(12);
  const [batchHumidityVariance, setBatchHumidityVariance] = useState(1);
  const [batchBaseBattery, setBatchBaseBattery] = useState(95);
  const [batchBatteryVariance, setBatchBatteryVariance] = useState(1);
  const [batchIncludeBalls, setBatchIncludeBalls] = useState(true);
  const [batchPreview, setBatchPreview] = useState<CreateGatewayReadingDto[]>([]);
  const [simulationAlerts, setSimulationAlerts] = useState<SimulatedAlert[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [sensorTableTab, setSensorTableTab] = useState<'gateway' | 'sensors'>('gateway');
  const [recentGatewayId, setRecentGatewayId] = useState('');
  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [recentStartAt, setRecentStartAt] = useState(defaultRange.start);
  const [recentEndAt, setRecentEndAt] = useState(defaultRange.end);
  const [recentTab, setRecentTab] = useState<'gateway' | 'sensors'>('gateway');
  const [recentGatewayReadings, setRecentGatewayReadings] = useState<
    {
      temperature: number;
      humidity: number;
      batteryPercent: number;
      recordedAt: string;
    }[]
  >([]);
  const [recentSensorReadings, setRecentSensorReadings] = useState<
    {
      sensorId: string;
      sensorLabel: string;
      temperature: number;
      humidity: number;
      batteryPercent: number;
      recordedAt: string;
    }[]
  >([]);
  const [triggerOptions, setTriggerOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedTriggerId, setSelectedTriggerId] = useState('all');
  const [triggerSearch, setTriggerSearch] = useState('');
  const [isClearingReadings, setIsClearingReadings] = useState(false);

  const gatewayOptions = useMemo<GatewayOption[]>(() => {
    return gateways.map((gateway) => ({
      id: gateway.id,
      label: buildGatewayLabel(gateway, locale),
    }));
  }, [gateways, locale]);

  const pairedGatewayOptions = useMemo<GatewayOption[]>(() => {
    return gateways
      .filter((gateway) => Boolean(gateway.cellId || gateway.cell?.id))
      .map((gateway) => ({
        id: gateway.id,
        label: buildGatewayLabel(gateway, locale),
      }));
  }, [gateways, locale]);

  const sensorOptions = useMemo(() => {
    return sensors.map((sensor) => ({
      id: sensor.id,
      label: buildSensorLabel(sensor),
    }));
  }, [sensors]);

  const gatewaySensors = useMemo(() => {
    if (!batchGatewayId) return [];
    return sensors.filter((sensor) => sensor.gatewayId === batchGatewayId);
  }, [batchGatewayId, sensors]);

  const sensorPreviewRows = useMemo(() => {
    return batchPreview.map((reading) => ({
      recordedAt: reading.recordedAt,
      balls: reading.balls ?? [],
    }));
  }, [batchPreview]);

  const ballIds = useMemo(() => {
    return gatewaySensors.map((sensor) => sensor.externalId);
  }, [gatewaySensors]);

  const refreshData = useCallback(async () => {
    try {
      const orgId = selectedOrganizationId === 'all' ? undefined : selectedOrganizationId;
      const [gatewaysResponse, sensorsResponse] = await Promise.all([
        getGateways(orgId ? { organizationId: orgId } : undefined),
        getSensors(orgId ? { organizationId: orgId } : undefined),
      ]);
      if (gatewaysResponse?.error || sensorsResponse?.error) {
        toast.error(tToast('loadError'));
      }
      if (gatewaysResponse?.data) {
        setGateways(gatewaysResponse.data as Gateway[]);
      }
      if (sensorsResponse?.data) {
        setSensors(sensorsResponse.data as Sensor[]);
      }
    } catch (error) {
      toast.error(tToast('loadError'));
    }
  }, [getGateways, getSensors, selectedOrganizationId, tToast]);

  useEffect(() => {
    if (isCurrentUserLoading) return;
    if (!user || !isSuperAdmin) return;
    refreshData();
    getTriggers({ page: 1, limit: 200 }).then((response) => {
      if (response?.data?.items) {
        setTriggerOptions(
          response.data.items
            .filter((trigger) => Boolean(trigger.id && trigger.name))
            .map((trigger) => ({
              id: trigger.id as string,
              name: trigger.name as string,
            })),
        );
      }
    });
  }, [isCurrentUserLoading, isSuperAdmin, refreshData, user]);

  useEffect(() => {
    setCreateGatewayId('');
    setTransferGatewayId('');
    setTransferSensorId('');
    setBatchGatewayId('');
    setRecentGatewayId('');
    setSelectedTriggerId('all');
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (!isCurrentUserLoading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [isCurrentUserLoading, isSuperAdmin, router]);

  const fetchRecentReadings = useCallback(() => {
    if (!recentGatewayId) {
      setRecentGatewayReadings([]);
      setRecentSensorReadings([]);
      return;
    }
    const start = recentStartAt ? new Date(recentStartAt) : undefined;
    const end = recentEndAt ? new Date(recentEndAt) : undefined;
    const params = {
      start: start && !Number.isNaN(start.getTime()) ? start.toISOString() : undefined,
      end: end && !Number.isNaN(end.getTime()) ? end.toISOString() : undefined,
    };
    getGatewayReadingsRange(recentGatewayId, params).then((response) => {
      if (response?.data) {
        setRecentGatewayReadings(response.data.gatewayReadings ?? []);
        setRecentSensorReadings(response.data.sensorReadings ?? []);
      } else if (response?.error) {
        toast.error(tToast('loadError'));
      }
    });
  }, [getGatewayReadingsRange, recentEndAt, recentGatewayId, recentStartAt, tToast]);

  useEffect(() => {
    fetchRecentReadings();
  }, [fetchRecentReadings]);

  const handleCreateSensor = async () => {
    if (!createGatewayId) {
      toast.error(tToast('createSensorError'));
      return;
    }
    const result = await createSensor({
      gatewayId: createGatewayId,
      name: createName.trim() || undefined,
      externalId: createExternalId.trim() || undefined,
    });
    if (result?.data) {
      toast.success(tToast('createSensorSuccess'));
      setCreateName('');
      setCreateExternalId('');
      await refreshData();
    } else {
      toast.error(result?.error || tToast('createSensorError'));
    }
  };

  const handleTransferSensor = async () => {
    if (!transferSensorId || !transferGatewayId) {
      toast.error(tToast('transferSensorError'));
      return;
    }
    const result = await transferSensor(transferSensorId, { gatewayId: transferGatewayId });
    if (result?.data) {
      toast.success(tToast('transferSensorSuccess'));
      await refreshData();
    } else {
      toast.error(result?.error || tToast('transferSensorError'));
    }
  };

  const handleBatchReadings = async () => {
    const intervalHours = Number.isFinite(batchIntervalHours)
      ? batchIntervalHours
      : 0;
    if (!batchGatewayId || intervalHours <= 0) {
      toast.error(tToast('batchReadingsError'));
      return;
    }

    const parsedStartAt = batchStartAt ? new Date(batchStartAt) : new Date();
    const startAt = Number.isNaN(parsedStartAt.getTime())
      ? new Date()
      : parsedStartAt;
    const now = new Date();
    const sameDay =
      startAt.getFullYear() === now.getFullYear() &&
      startAt.getMonth() === now.getMonth() &&
      startAt.getDate() === now.getDate();
    const effectiveStartAt = sameDay
      ? new Date(startAt.getTime() - 24 * 60 * 60 * 1000)
      : startAt;
    const effectiveEndAt = sameDay ? startAt : now;
    const diffMs = Math.max(0, effectiveEndAt.getTime() - effectiveStartAt.getTime());
    const intervalMs = intervalHours * 60 * 60 * 1000;
    const count = Math.max(1, Math.floor(diffMs / intervalMs) + 1);
    const readings = Array.from({ length: count }, (_, index) => {
      const recordedAt = new Date(effectiveStartAt.getTime() + index * intervalMs);
      const tempVariance = batchTemperatureVariance
        ? (Math.random() * batchTemperatureVariance * 2 - batchTemperatureVariance)
        : 0;
      const humidityVariance = batchHumidityVariance
        ? (Math.random() * batchHumidityVariance * 2 - batchHumidityVariance)
        : 0;
      const batteryVariance = batchBatteryVariance
        ? (Math.random() * batchBatteryVariance * 2 - batchBatteryVariance)
        : 0;
      const temperature = Number((batchBaseTemperature + tempVariance).toFixed(2));
      const humidity = Number((batchBaseHumidity + humidityVariance).toFixed(2));
      const batteryPercent = Number(
        Math.min(100, Math.max(0, batchBaseBattery + batteryVariance)).toFixed(2),
      );
      const balls: GatewayBallReadingDto[] | undefined = batchIncludeBalls
        ? gatewaySensors.map((sensor) => ({
            id: sensor.externalId,
            temperature,
            humidity,
            batteryPercent,
            recordedAt: recordedAt.toISOString(),
          }))
        : undefined;
      return {
        temperature,
        humidity,
        batteryPercent,
        recordedAt: recordedAt.toISOString(),
        balls,
      };
    });

    setBatchPreview(readings);
    setSimulationAlerts([]);
  };

  const handleUpdateGatewayValue = (
    index: number,
    field: 'temperature' | 'humidity' | 'batteryPercent',
    value: string,
  ) => {
    const numeric = value === '' ? '' : Number(value);
    setBatchPreview((prev) =>
      prev.map((reading, idx) => {
        if (idx !== index) return reading;
        return {
          ...reading,
          [field]: numeric === '' || Number.isNaN(numeric) ? reading[field] : numeric,
          balls: reading.balls?.map((ball) => ({
            ...ball,
            [field]: numeric === '' || Number.isNaN(numeric) ? ball[field] : numeric,
          })),
        };
      }),
    );
  };

  const handleUpdateBallValue = (
    rowIndex: number,
    ballId: string,
    field: 'temperature' | 'humidity' | 'batteryPercent',
    value: string,
  ) => {
    const numeric = value === '' ? '' : Number(value);
    setBatchPreview((prev) =>
      prev.map((reading, idx) => {
        if (idx !== rowIndex) return reading;
        const balls = reading.balls ?? [];
        const existing = balls.find((ball) => ball.id === ballId);
        const updatedValue =
          numeric === '' || Number.isNaN(numeric) ? existing?.[field] ?? 0 : numeric;
        const nextBalls = existing
          ? balls.map((ball) =>
              ball.id === ballId ? { ...ball, [field]: updatedValue } : ball,
            )
          : [
              ...balls,
              {
                id: ballId,
                temperature: field === 'temperature' ? updatedValue : reading.temperature,
                humidity: field === 'humidity' ? updatedValue : reading.humidity,
                batteryPercent: field === 'batteryPercent' ? updatedValue : reading.batteryPercent,
                recordedAt: reading.recordedAt,
              },
            ];
        return {
          ...reading,
          balls: nextBalls,
        };
      }),
    );
  };

  const handleSendReadings = async () => {
    if (!batchGatewayId || batchPreview.length === 0) {
      toast.error(tToast('batchReadingsError'));
      return;
    }
    setIsSimulating(true);
    try {
      const result = await simulateGatewayReadingsBatch(batchGatewayId, {
        readings: batchPreview,
      });
      if (result?.data) {
        setSimulationAlerts(result.data.alerts ?? []);
        toast.success(tToast('batchReadingsSuccess'));
      } else {
        toast.error(result?.error || tToast('batchReadingsError'));
      }
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearReadings = async () => {
    if (!recentGatewayId) {
      toast.error(tToast('clearReadingsError'));
      return;
    }
    if (!window.confirm(t('clearReadingsConfirm'))) {
      return;
    }
    setIsClearingReadings(true);
    try {
      const start = recentStartAt ? new Date(recentStartAt) : undefined;
      const end = recentEndAt ? new Date(recentEndAt) : undefined;
      const params = {
        start: start && !Number.isNaN(start.getTime()) ? start.toISOString() : undefined,
        end: end && !Number.isNaN(end.getTime()) ? end.toISOString() : undefined,
      };
      const result = await clearGatewayReadingsRange(recentGatewayId, params);
      if (result?.data) {
        toast.success(tToast('clearReadingsSuccess'));
        fetchRecentReadings();
      } else {
        toast.error(result?.error || tToast('clearReadingsError'));
      }
    } finally {
      setIsClearingReadings(false);
    }
  };

  type AlertCondition = {
    type?: string;
    metric?: string;
    operator?: string;
    value?: number;
    secondaryValue?: number;
    changeDirection?: string;
    changeAmount?: number;
    timeWindowHours?: number;
    timeWindowDays?: number;
    unit?: string;
    valueSources?: string[];
  };

  const formatCondition = (condition: AlertCondition) => {
    if (!condition.type || !condition.metric) return '';
    const metricLabel = tMetric(condition.metric);
    const unit = condition.unit || '';

    if (condition.type === 'THRESHOLD') {
      if (condition.valueSources && condition.valueSources.length > 0) {
        return '';
      }

      if (condition.operator === 'BETWEEN') {
        return tAlertCondition('between', {
          metric: metricLabel,
          min: condition.value ?? '',
          max: condition.secondaryValue ?? '',
          unit,
        });
      }

      return tAlertCondition('threshold', {
        metric: metricLabel,
        operator: condition.operator ? tOperator(condition.operator) : '',
        value: condition.value ?? '',
        unit,
      });
    }

    if (condition.type === 'CHANGE') {
      let windowText = '';
      if (condition.timeWindowDays) {
        windowText = tAlertWindow('days', { count: condition.timeWindowDays });
      } else if (condition.timeWindowHours) {
        windowText = tAlertWindow('hours', { count: condition.timeWindowHours });
      }

      if (condition.operator && condition.value !== undefined) {
        return tAlertCondition('changeThreshold', {
          metric: metricLabel,
          direction: condition.changeDirection
            ? tDirection(condition.changeDirection)
            : '',
          operator: condition.operator ? tOperator(condition.operator) : '',
          value: condition.value ?? '',
          unit,
          window: windowText,
        });
      }
      return tAlertCondition('change', {
        metric: metricLabel,
        direction: condition.changeDirection
          ? tDirection(condition.changeDirection)
          : '',
        amount: condition.changeAmount ?? '',
        unit,
        window: windowText,
      });
    }

    return '';
  };

  const resolveAlertDescription = (alert: SimulatedAlert) => {
    if (alert.descriptionParams) {
      const params = alert.descriptionParams as {
        triggerName?: string;
        conditions?: AlertCondition[];
      };
      const conditionLines = Array.isArray(params.conditions)
        ? params.conditions.map(formatCondition).filter(Boolean)
        : [];
      const conditions = conditionLines.join(', ');
      const triggerName = params.triggerName ?? alert.triggerName ?? '';

      if (!conditions) {
        return {
          text: tAlertDescription('triggerMatchedNoConditions', { triggerName }),
          lines: [],
        };
      }

      return {
        text: tAlertDescription('triggerMatched', { triggerName, conditions }),
        lines: conditionLines,
      };
    }

    const rawDescription = alert.description ?? '';
    const cleanedDescription = rawDescription.replace(/^Trigger ".+?" matched:\s*/i, '');
    return {
      text: cleanedDescription,
      lines: cleanedDescription ? [cleanedDescription] : [],
    };
  };

  const filteredSimulationAlerts =
    selectedTriggerId === 'all'
      ? simulationAlerts
      : simulationAlerts.filter((alert) => alert.triggerId === selectedTriggerId);

  if (isCurrentUserLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        {tCommon('loading')}
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('accessDeniedTitle')}</h1>
        <p className="text-sm text-muted-foreground">{t('accessDeniedDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>
        </div>
        <div className="min-w-[220px]">
          <OrganizationSelect
            value={selectedOrganizationId}
            onChange={setSelectedOrganizationId}
            includeAll
            allLabel={t('allOrganizations')}
            placeholder={t('organizationLabel')}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('createSensorTitle')}</CardTitle>
            <CardDescription>{t('createSensorDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-gateway">{t('gatewayLabel')}</Label>
              <Select value={createGatewayId} onValueChange={setCreateGatewayId}>
                <SelectTrigger id="create-gateway" className="w-full">
                  <SelectValue
                    placeholder={gatewayOptions.length ? t('gatewayLabel') : t('noGateways')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {gatewayOptions.map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.id}>
                      {gateway.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-name">{t('sensorNameLabel')}</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                placeholder={t('sensorNameLabel')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-external">{t('sensorExternalIdLabel')}</Label>
              <Input
                id="create-external"
                value={createExternalId}
                onChange={(event) => setCreateExternalId(event.target.value)}
                placeholder={t('sensorExternalIdLabel')}
              />
            </div>
            <Button
              onClick={handleCreateSensor}
              disabled={!createGatewayId || isCreating || isLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {t('createSensorButton')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('transferSensorTitle')}</CardTitle>
            <CardDescription>{t('transferSensorDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-sensor">{t('sensorLabel')}</Label>
              <Select value={transferSensorId} onValueChange={setTransferSensorId}>
                <SelectTrigger id="transfer-sensor" className="w-full">
                  <SelectValue placeholder={sensorOptions.length ? t('sensorLabel') : t('noSensors')} />
                </SelectTrigger>
                <SelectContent>
                  {sensorOptions.map((sensor) => (
                    <SelectItem key={sensor.id} value={sensor.id}>
                      {sensor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-gateway">{t('targetGatewayLabel')}</Label>
              <Select value={transferGatewayId} onValueChange={setTransferGatewayId}>
                <SelectTrigger id="transfer-gateway" className="w-full">
                  <SelectValue
                    placeholder={
                      gatewayOptions.length ? t('targetGatewayLabel') : t('noGateways')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {gatewayOptions.map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.id}>
                      {gateway.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleTransferSensor}
              disabled={!transferSensorId || !transferGatewayId || isUpdating || isLoading}
            >
              {t('transferSensorButton')}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('batchReadingsTitle')}</CardTitle>
            <CardDescription>{t('batchReadingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="batch-gateway">{t('gatewayLabel')}</Label>
              <Select value={batchGatewayId} onValueChange={setBatchGatewayId}>
                <SelectTrigger id="batch-gateway" className="w-full">
                  <SelectValue
                    placeholder={pairedGatewayOptions.length ? t('gatewayLabel') : t('noGateways')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {pairedGatewayOptions.map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.id}>
                      {gateway.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-start">{t('startAtLabel')}</Label>
              <Input
                id="batch-start"
                type="datetime-local"
                value={batchStartAt}
                onChange={(event) => setBatchStartAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-interval">{t('intervalLabel')}</Label>
              <Input
                id="batch-interval"
                type="number"
                min={1}
                value={batchIntervalHours}
                onChange={(event) => setBatchIntervalHours(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-base-temp">{t('temperatureLabel')}</Label>
              <Input
                id="batch-base-temp"
                type="number"
                value={batchBaseTemperature}
                onChange={(event) => setBatchBaseTemperature(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-temp-variance">{t('temperatureVarianceLabel')}</Label>
              <Input
                id="batch-temp-variance"
                type="number"
                min={0}
                value={batchTemperatureVariance}
                onChange={(event) => setBatchTemperatureVariance(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-base-humidity">{t('humidityLabel')}</Label>
              <Input
                id="batch-base-humidity"
                type="number"
                value={batchBaseHumidity}
                onChange={(event) => setBatchBaseHumidity(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-humidity-variance">{t('humidityVarianceLabel')}</Label>
              <Input
                id="batch-humidity-variance"
                type="number"
                min={0}
                value={batchHumidityVariance}
                onChange={(event) => setBatchHumidityVariance(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-base-battery">{t('batteryLabel')}</Label>
              <Input
                id="batch-base-battery"
                type="number"
                value={batchBaseBattery}
                onChange={(event) => setBatchBaseBattery(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-battery-variance">{t('batteryVarianceLabel')}</Label>
              <Input
                id="batch-battery-variance"
                type="number"
                min={0}
                value={batchBatteryVariance}
                onChange={(event) => setBatchBatteryVariance(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-include-balls">{t('gatewayIncludeBallsLabel')}</Label>
              <Select
                value={batchIncludeBalls ? 'yes' : 'no'}
                onValueChange={(value) => setBatchIncludeBalls(value === 'yes')}
              >
                <SelectTrigger id="batch-include-balls" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('gatewayIncludeBallsYes')}</SelectItem>
                  <SelectItem value="no">{t('gatewayIncludeBallsNo')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleBatchReadings}
                disabled={!batchGatewayId || isCreating || isLoading}
                className="w-full"
              >
                {t('batchReadingsButton')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('previewTitle')}</CardTitle>
            <CardDescription>{t('previewDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {batchPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('previewEmpty')}</p>
            ) : (
              <>
                <Tabs value={sensorTableTab} onValueChange={(value) => setSensorTableTab(value as 'gateway' | 'sensors')}>
                  <TabsList>
                    <TabsTrigger value="gateway">{t('gatewayTab')}</TabsTrigger>
                    <TabsTrigger value="sensors">{t('sensorTab')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="gateway">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('previewRecordedAt')}</TableHead>
                          <TableHead>{t('previewTemperature')}</TableHead>
                          <TableHead>{t('previewHumidity')}</TableHead>
                          <TableHead>{t('previewBattery')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batchPreview.map((reading, index) => (
                          <TableRow key={reading.recordedAt}>
                            <TableCell>{new Date(reading.recordedAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Input
                                value={reading.temperature}
                                type="number"
                                className="h-8 w-24"
                                onChange={(event) =>
                                  handleUpdateGatewayValue(index, 'temperature', event.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={reading.humidity}
                                type="number"
                                className="h-8 w-24"
                                onChange={(event) =>
                                  handleUpdateGatewayValue(index, 'humidity', event.target.value)
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={reading.batteryPercent}
                                type="number"
                                className="h-8 w-24"
                                onChange={(event) =>
                                  handleUpdateGatewayValue(index, 'batteryPercent', event.target.value)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="sensors">
                    {ballIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('noSensors')}</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('previewRecordedAt')}</TableHead>
                            <TableHead>{t('sensorLabel')}</TableHead>
                            <TableHead>{t('previewTemperature')}</TableHead>
                            <TableHead>{t('previewHumidity')}</TableHead>
                            <TableHead>{t('previewBattery')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sensorPreviewRows.flatMap((row, rowIndex) =>
                            ballIds.map((ballId, ballIndex) => {
                              const ball = row.balls.find((entry) => entry.id === ballId);
                              return (
                                <TableRow key={`${row.recordedAt}-${ballId}`}>
                                  {ballIndex === 0 ? (
                                    <TableCell rowSpan={ballIds.length} className="align-top">
                                      {new Date(row.recordedAt).toLocaleString()}
                                    </TableCell>
                                  ) : null}
                                  <TableCell>{ballId}</TableCell>
                                  <TableCell>
                                    <Input
                                      value={ball?.temperature ?? ''}
                                      type="number"
                                      className="h-8 w-24 text-xs"
                                      placeholder={t('previewTemperature')}
                                      onChange={(event) =>
                                        handleUpdateBallValue(
                                          rowIndex,
                                          ballId,
                                          'temperature',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={ball?.humidity ?? ''}
                                      type="number"
                                      className="h-8 w-24 text-xs"
                                      placeholder={t('previewHumidity')}
                                      onChange={(event) =>
                                        handleUpdateBallValue(
                                          rowIndex,
                                          ballId,
                                          'humidity',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={ball?.batteryPercent ?? ''}
                                      type="number"
                                      className="h-8 w-20 text-xs"
                                      placeholder={t('previewBattery')}
                                      onChange={(event) =>
                                        handleUpdateBallValue(
                                          rowIndex,
                                          ballId,
                                          'batteryPercent',
                                          event.target.value,
                                        )
                                      }
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            }),
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end">
                  <Button onClick={handleSendReadings} disabled={isSimulating}>
                    {t('sendReadingsButton')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('simulationAlertsTitle')}</CardTitle>
              <CardDescription>{t('simulationAlertsDesc')}</CardDescription>
            </div>
            <div className="w-full md:w-64">
              <Label htmlFor="simulation-trigger-filter" className="sr-only">
                {t('simulationTriggerFilterLabel')}
              </Label>
              <Select
                value={selectedTriggerId}
                onValueChange={setSelectedTriggerId}
              >
                <SelectTrigger id="simulation-trigger-filter" className="w-full">
                  <SelectValue placeholder={t('simulationTriggerFilterLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      value={triggerSearch}
                      onChange={(event) => setTriggerSearch(event.target.value)}
                      placeholder={t('simulationTriggerSearchPlaceholder')}
                      className="h-8"
                    />
                  </div>
                  <SelectItem value="all">{t('simulationTriggerFilterAll')}</SelectItem>
                  {triggerOptions
                    .filter((trigger) =>
                      trigger.name.toLowerCase().includes(triggerSearch.trim().toLowerCase()),
                    )
                    .map((trigger) => (
                      <SelectItem key={trigger.id} value={trigger.id}>
                        {trigger.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isSimulating ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredSimulationAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('simulationAlertsEmpty')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('previewRecordedAt')}</TableHead>
                    <TableHead>{t('severityLabel')}</TableHead>
                    <TableHead>{t('triggerLabel')}</TableHead>
                    <TableHead>{t('descriptionLabel')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSimulationAlerts.map((alert, index) => {
                    const description = resolveAlertDescription(alert);
                    return (
                      <TableRow key={`${alert.triggerId}-${alert.recordedAt}-${index}`}>
                        <TableCell>{new Date(alert.recordedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {tSeverity(alert.severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>{alert.triggerName}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <span>{description.text}</span>
                            {description.lines.length > 0 && (
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {description.lines.map((line, idx) => (
                                  <div key={`${alert.triggerId}-${idx}`}>{line}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('readingsTitle')}</CardTitle>
          <CardDescription>{t('readingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="recent-gateway">{t('gatewayLabel')}</Label>
              <Select value={recentGatewayId} onValueChange={setRecentGatewayId}>
                <SelectTrigger id="recent-gateway" className="w-full">
                  <SelectValue
                    placeholder={pairedGatewayOptions.length ? t('gatewayLabel') : t('noGateways')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {pairedGatewayOptions.map((gateway) => (
                    <SelectItem key={gateway.id} value={gateway.id}>
                      {gateway.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recent-start">{t('startAtLabel')}</Label>
              <Input
                id="recent-start"
                type="datetime-local"
                value={recentStartAt}
                onChange={(event) => setRecentStartAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recent-end">{t('endAtLabel')}</Label>
              <Input
                id="recent-end"
                type="datetime-local"
                value={recentEndAt}
                onChange={(event) => setRecentEndAt(event.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={handleClearReadings}
              disabled={!recentGatewayId || isClearingReadings || isDeleting}
            >
              {isClearingReadings || isDeleting ? tCommon('loading') : t('clearReadingsAction')}
            </Button>
          </div>

          {recentGatewayReadings.length === 0 && recentSensorReadings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('readingsEmpty')}</p>
          ) : (
            <Tabs value={recentTab} onValueChange={(value) => setRecentTab(value as 'gateway' | 'sensors')}>
              <TabsList>
                <TabsTrigger value="gateway">{t('gatewayTab')}</TabsTrigger>
                <TabsTrigger value="sensors">{t('sensorTab')}</TabsTrigger>
              </TabsList>
              <TabsContent value="gateway">
                {recentGatewayReadings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('readingsEmpty')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('previewRecordedAt')}</TableHead>
                        <TableHead>{t('previewTemperature')}</TableHead>
                        <TableHead>{t('previewHumidity')}</TableHead>
                        <TableHead>{t('previewBattery')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentGatewayReadings.map((reading) => (
                        <TableRow key={reading.recordedAt}>
                          <TableCell>{new Date(reading.recordedAt).toLocaleString()}</TableCell>
                          <TableCell>{reading.temperature}</TableCell>
                          <TableCell>{reading.humidity}</TableCell>
                          <TableCell>{reading.batteryPercent}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="sensors">
                {recentSensorReadings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('readingsEmpty')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('previewRecordedAt')}</TableHead>
                        <TableHead>{t('sensorLabel')}</TableHead>
                        <TableHead>{t('previewTemperature')}</TableHead>
                        <TableHead>{t('previewHumidity')}</TableHead>
                        <TableHead>{t('previewBattery')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const grouped = new Map<string, Map<string, typeof recentSensorReadings[0]>>();
                        recentSensorReadings.forEach((reading) => {
                          const group = grouped.get(reading.recordedAt) ?? new Map();
                          if (!group.has(reading.sensorId)) {
                            group.set(reading.sensorId, reading);
                          }
                          grouped.set(reading.recordedAt, group);
                        });

                        return Array.from(grouped.entries())
                          .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                          .flatMap(([recordedAt, readingsMap]) => {
                            const readings = Array.from(readingsMap.values());
                            return readings.map((reading, index) => (
                              <TableRow key={`${reading.sensorId}-${reading.recordedAt}`}>
                                {index === 0 ? (
                                  <TableCell rowSpan={readings.length} className="align-top">
                                    {new Date(recordedAt).toLocaleString()}
                                  </TableCell>
                                ) : null}
                                <TableCell>{reading.sensorLabel}</TableCell>
                                <TableCell>{reading.temperature}</TableCell>
                                <TableCell>{reading.humidity}</TableCell>
                                <TableCell>{reading.batteryPercent}%</TableCell>
                              </TableRow>
                            ));
                          });
                      })()}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
