'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrentUser } from '@/hooks';
import { useGatewayApi } from '@/hooks/use-gateway-api';
import type { CreateSensorReadingDto, Gateway, Sensor, SensorReading } from '@/schemas/sites.schema';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

type GatewayOption = {
  id: string;
  label: string;
};

const getDefaultStartAt = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${now.getFullYear()}-${month}-${day}T${hours}:${minutes}`;
};

const buildCellLabel = (site: string, compound: string, cell: string) =>
  `${site} / ${compound} / ${cell}`;

const buildSensorLabel = (sensor: Sensor) => {
  if (sensor.name && sensor.name.trim().length > 0) {
    return `${sensor.name} (${sensor.externalId})`;
  }
  return sensor.externalId;
};

const buildGatewayLabel = (gateway: Gateway) => {
  const baseLabel =
    gateway.name && gateway.name.trim().length > 0 ? gateway.name : gateway.externalId;
  const cellLabel = gateway.cell?.compound?.site?.name && gateway.cell?.compound?.name
    ? buildCellLabel(
        gateway.cell.compound.site.name,
        gateway.cell.compound.name,
        gateway.cell.name,
      )
    : gateway.cell?.name;
  return cellLabel ? `${baseLabel} - ${cellLabel}` : baseLabel;
};

export function SimulatorPage() {
  const t = useTranslations('simulator');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast.simulator');
  const router = useRouter();
  const { user, isSuperAdmin, isLoading: isCurrentUserLoading } = useCurrentUser();
  const {
    getGateways,
    getSensors,
    createSensor,
    transferSensor,
    createSensorReadingsBatch,
    getSensorReadings,
    isLoading,
    isCreating,
    isUpdating,
  } = useGatewayApi();

  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [createGatewayId, setCreateGatewayId] = useState('');
  const [createName, setCreateName] = useState('');
  const [createExternalId, setCreateExternalId] = useState('');
  const [transferSensorId, setTransferSensorId] = useState('');
  const [transferGatewayId, setTransferGatewayId] = useState('');
  const [batchSensorId, setBatchSensorId] = useState('');
  const [batchCount, setBatchCount] = useState(24);
  const [batchStartAt, setBatchStartAt] = useState(getDefaultStartAt());
  const [batchIntervalMinutes, setBatchIntervalMinutes] = useState(60);
  const [batchBaseTemperature, setBatchBaseTemperature] = useState(20);
  const [batchTemperatureVariance, setBatchTemperatureVariance] = useState(2);
  const [batchBaseHumidity, setBatchBaseHumidity] = useState(12);
  const [batchHumidityVariance, setBatchHumidityVariance] = useState(1);
  const [batchBaseBattery, setBatchBaseBattery] = useState(95);
  const [batchBatteryVariance, setBatchBatteryVariance] = useState(1);
  const [batchPreview, setBatchPreview] = useState<CreateSensorReadingDto[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);

  const gatewayOptions = useMemo<GatewayOption[]>(() => {
    return gateways.map((gateway) => ({
      id: gateway.id,
      label: buildGatewayLabel(gateway),
    }));
  }, [gateways]);

  const sensorOptions = useMemo(() => {
    return sensors.map((sensor) => ({
      id: sensor.id,
      label: buildSensorLabel(sensor),
    }));
  }, [sensors]);

  const refreshData = useCallback(async () => {
    try {
      const [gatewaysResponse, sensorsResponse] = await Promise.all([
        getGateways(),
        getSensors(),
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
  }, [getGateways, getSensors, tToast]);

  const refreshReadings = useCallback(
    async (sensorId: string) => {
      const response = await getSensorReadings(sensorId, { limit: 50 });
      if (response?.data) {
        setSensorReadings(response.data);
      } else if (response?.error) {
        toast.error(tToast('loadError'));
      }
    },
    [getSensorReadings, tToast],
  );

  useEffect(() => {
    if (isCurrentUserLoading) return;
    if (!user || !isSuperAdmin) return;
    refreshData();
  }, [isCurrentUserLoading, isSuperAdmin, refreshData, user]);

  useEffect(() => {
    if (!isCurrentUserLoading && !isSuperAdmin) {
      router.replace('/admin');
    }
  }, [isCurrentUserLoading, isSuperAdmin, router]);

  useEffect(() => {
    if (!batchSensorId) {
      setSensorReadings([]);
      return;
    }
    refreshReadings(batchSensorId);
  }, [batchSensorId, refreshReadings]);

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
    const count = Number.isFinite(batchCount) ? Math.floor(batchCount) : 0;
    const intervalMinutes = Number.isFinite(batchIntervalMinutes)
      ? batchIntervalMinutes
      : 0;
    if (!batchSensorId || count <= 0 || intervalMinutes <= 0) {
      toast.error(tToast('batchReadingsError'));
      return;
    }

    const parsedStartAt = batchStartAt ? new Date(batchStartAt) : new Date();
    const startAt = Number.isNaN(parsedStartAt.getTime())
      ? new Date()
      : parsedStartAt;
    const readings = Array.from({ length: count }, (_, index) => {
      const recordedAt = new Date(
        startAt.getTime() + index * intervalMinutes * 60 * 1000,
      );
      const tempVariance = batchTemperatureVariance
        ? (Math.random() * batchTemperatureVariance * 2 - batchTemperatureVariance)
        : 0;
      const humidityVariance = batchHumidityVariance
        ? (Math.random() * batchHumidityVariance * 2 - batchHumidityVariance)
        : 0;
      const batteryVariance = batchBatteryVariance
        ? (Math.random() * batchBatteryVariance * 2 - batchBatteryVariance)
        : 0;
      return {
        temperature: Number((batchBaseTemperature + tempVariance).toFixed(2)),
        humidity: Number((batchBaseHumidity + humidityVariance).toFixed(2)),
        batteryPercent: Number(
          Math.min(100, Math.max(0, batchBaseBattery + batteryVariance)).toFixed(2),
        ),
        recordedAt: recordedAt.toISOString(),
      };
    });

    setBatchPreview(readings);
    const result = await createSensorReadingsBatch(batchSensorId, { readings });
    if (result?.data) {
      toast.success(tToast('batchReadingsSuccess'));
      setBatchPreview(readings);
      await refreshReadings(batchSensorId);
    } else {
      toast.error(result?.error || tToast('batchReadingsError'));
    }
  };

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
              <Label htmlFor="batch-sensor">{t('sensorLabel')}</Label>
              <Select value={batchSensorId} onValueChange={setBatchSensorId}>
                <SelectTrigger id="batch-sensor" className="w-full">
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
              <Label htmlFor="batch-count">{t('countLabel')}</Label>
              <Input
                id="batch-count"
                type="number"
                min={1}
                value={batchCount}
                onChange={(event) => setBatchCount(Number(event.target.value))}
              />
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
                value={batchIntervalMinutes}
                onChange={(event) => setBatchIntervalMinutes(Number(event.target.value))}
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
            <div className="flex items-end">
              <Button
                onClick={handleBatchReadings}
                disabled={!batchSensorId || isCreating || isLoading}
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
          <CardContent>
            {batchPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('previewEmpty')}</p>
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
                  {batchPreview.map((reading) => (
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('sensorsTitle')}</CardTitle>
          <CardDescription>{t('sensorsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sensors.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noSensors')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('sensorTableSensor')}</TableHead>
                  <TableHead>{t('sensorTableExternalId')}</TableHead>
                  <TableHead>{t('sensorTableGateway')}</TableHead>
                  <TableHead>{t('sensorTableStatus')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sensors.map((sensor) => (
                  <TableRow key={sensor.id}>
                    <TableCell>{sensor.name || tCommon('none')}</TableCell>
                    <TableCell>{sensor.externalId}</TableCell>
                    <TableCell>
                      {sensor.gateway ? buildGatewayLabel(sensor.gateway) : tCommon('none')}
                    </TableCell>
                    <TableCell>{sensor.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('readingsTitle')}</CardTitle>
          <CardDescription>{t('readingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sensorReadings.length === 0 ? (
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
                {sensorReadings.map((reading) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
