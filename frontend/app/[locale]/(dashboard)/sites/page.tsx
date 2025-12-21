"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Plus, Calendar, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useSiteApi } from '@/hooks/use-site-api';
import { useApi } from '@/hooks/use-api';
import { format, subDays, subMonths, subYears } from 'date-fns';
import { storage, STORAGE_KEYS } from '@/lib/local-storage';

interface SensorReading {
  id: string;
  cellId: string;
  metric: 'TEMPERATURE' | 'HUMIDITY' | 'EMC';
  value: number;
  recordedAt: string;
}

interface Trade {
  id: string;
  cellId: string;
  amountKg: number;
  tradedAt: string;
  commodity: {
    id: string;
    name: string;
    origin: string | null;
    commodityType: {
      id: string;
      name: string;
    } | null;
  };
}

interface Alert {
  id: string;
  cellId: string;
  title: string | null;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
  thresholdValue: number | null;
  unit: string | null;
  startedAt: string;
}

interface CellDetails {
  cell: {
    id: string;
    name: string;
    compound: {
      id: string;
      name: string;
      site: {
        id: string;
        name: string;
      };
    };
  };
  sensorReadings: SensorReading[];
  trades: Trade[];
  alerts: Alert[];
}

interface MultipleCellsDetails {
  cells: Array<{
    id: string;
    name: string;
    compound: {
      id: string;
      name: string;
      site: {
        id: string;
        name: string;
      };
    };
  }>;
  sensorReadings: SensorReading[];
  trades: Trade[];
  alerts: Alert[];
}

// Simple cache object for storing cell details by cellId and date range
const cellDetailsCache: Record<string, CellDetails> = {};

function getCacheKey(cellId: string, startDate: string, endDate: string): string {
  return `${cellId}-${startDate}-${endDate}`;
}

export default function SitesPage() {
  const t = useTranslations('sites');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');
  const { getSites } = useSiteApi();
  const { get, post } = useApi();

  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    return storage.get<string>(STORAGE_KEYS.SITES_SELECTED_SITE) || '';
  });
  const [selectedCellIds, setSelectedCellIds] = useState<string[]>(() => {
    return storage.get<string[]>(STORAGE_KEYS.SITES_SELECTED_CELLS) || [];
  });
  const [cellsDetails, setCellsDetails] = useState<MultipleCellsDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7days' | 'month' | 'year' | 'custom'>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load sites on mount
  useEffect(() => {
    loadSites();
  }, []);

  // Pre-select first site if no selection and sites are loaded
  useEffect(() => {
    if (sites.length > 0 && !selectedSiteId) {
      const firstSite = sites[0];
      setSelectedSiteId(firstSite.id);

      // Auto-select all cells from the first site
      const allCellIds = firstSite.compounds?.flatMap((c: any) =>
        c.cells?.map((cell: any) => cell.id) || []
      ) || [];
      setSelectedCellIds(allCellIds);
    }
  }, [sites, selectedSiteId]);

  // Save site selection to local storage
  useEffect(() => {
    if (selectedSiteId) {
      storage.set(STORAGE_KEYS.SITES_SELECTED_SITE, selectedSiteId);
    }
  }, [selectedSiteId]);

  // Save cell selection to local storage
  useEffect(() => {
    storage.set(STORAGE_KEYS.SITES_SELECTED_CELLS, selectedCellIds);
  }, [selectedCellIds]);

  useEffect(() => {
    // Load details for all selected cells
    if (selectedCellIds.length > 0) {
      loadMultipleCellsDetails(selectedCellIds, dateRange, customStartDate, customEndDate);
    } else {
      setCellsDetails(null);
    }
  }, [selectedCellIds, dateRange, customStartDate, customEndDate]);

  const loadSites = async () => {
    try {
      const response = await getSites();
      const data = response?.data || [];
      setSites(data);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const getDateRangeParams = (
    dateRange: '7days' | 'month' | 'year' | 'custom',
    customStartDate: string,
    customEndDate: string
  ): Record<string, string> | null => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRange) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return null;
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        break;
      default:
        startDate = subDays(now, 7);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const loadCellDetails = async (
    cellId: string,
    dateRange: '7days' | 'month' | 'year' | 'custom',
    customStartDate: string,
    customEndDate: string
  ) => {
    setLoading(true);
    try {
      const params = getDateRangeParams(dateRange, customStartDate, customEndDate);
      if (!params) {
        setLoading(false);
        return;
      }

      const cacheKey = getCacheKey(cellId, params.startDate, params.endDate);

      // Check cache first
      if (cellDetailsCache[cacheKey]) {
        setCellDetails(cellDetailsCache[cacheKey]);
        setLoading(false);
        return;
      }

      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/sites/cells/${cellId}/details${queryString ? `?${queryString}` : ''}`;
      const response = await get<CellDetails>(endpoint);

      if (response?.data) {
        // Store in cache
        cellDetailsCache[cacheKey] = response.data;
        setCellDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to load cell details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMultipleCellsDetails = async (
    cellIds: string[],
    dateRange: '7days' | 'month' | 'year' | 'custom',
    customStartDate: string,
    customEndDate: string
  ) => {
    setLoading(true);
    try {
      const params = getDateRangeParams(dateRange, customStartDate, customEndDate);
      if (!params) {
        setLoading(false);
        return;
      }

      const endpoint = `/sites/cells/details`;
      const response = await post<MultipleCellsDetails>(endpoint, {
        cellIds,
        startDate: params.startDate,
        endDate: params.endDate,
      });

      if (response?.data) {
        setCellsDetails(response.data);
      }
    } catch (error) {
      console.error('Failed to load multiple cells details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    // Auto-select all cells when site changes
    const site = sites.find(s => s.id === siteId);
    const allCellIds: string[] = [];
    site?.compounds?.forEach((compound: any) => {
      compound.cells?.forEach((cell: any) => {
        allCellIds.push(cell.id);
      });
    });
    setSelectedCellIds(allCellIds);
  };

  const handleCellToggle = (cellId: string) => {
    setSelectedCellIds(prev =>
      prev.includes(cellId)
        ? prev.filter(id => id !== cellId)
        : [...prev, cellId]
    );
  };

  const handleCompoundToggle = (compoundId: string) => {
    const site = sites.find(s => s.id === selectedSiteId);
    const compound = site?.compounds?.find((c: any) => c.id === compoundId);
    const compoundCellIds = compound?.cells?.map((cell: any) => cell.id) || [];

    // Check if all cells in this compound are selected
    const allSelected = compoundCellIds.every(id => selectedCellIds.includes(id));

    if (allSelected) {
      // Deselect all cells in this compound
      setSelectedCellIds(prev => prev.filter(id => !compoundCellIds.includes(id)));
    } else {
      // Select all cells in this compound
      setSelectedCellIds(prev => [...new Set([...prev, ...compoundCellIds])]);
    }
  };

  const handleSelectAll = () => {
    const site = sites.find(s => s.id === selectedSiteId);
    const allCellIds: string[] = [];
    site?.compounds?.forEach((compound: any) => {
      compound.cells?.forEach((cell: any) => {
        allCellIds.push(cell.id);
      });
    });

    // Check if all cells are selected
    const allSelected = allCellIds.length > 0 && allCellIds.every(id => selectedCellIds.includes(id));

    if (allSelected) {
      setSelectedCellIds([]);
    } else {
      setSelectedCellIds(allCellIds);
    }
  };

  const isCompoundSelected = (compoundId: string) => {
    const site = sites.find(s => s.id === selectedSiteId);
    const compound = site?.compounds?.find((c: any) => c.id === compoundId);
    const compoundCellIds = compound?.cells?.map((cell: any) => cell.id) || [];
    return compoundCellIds.length > 0 && compoundCellIds.every(id => selectedCellIds.includes(id));
  };

  const isCompoundIndeterminate = (compoundId: string) => {
    const site = sites.find(s => s.id === selectedSiteId);
    const compound = site?.compounds?.find((c: any) => c.id === compoundId);
    const compoundCellIds = compound?.cells?.map((cell: any) => cell.id) || [];
    const selectedCount = compoundCellIds.filter(id => selectedCellIds.includes(id)).length;
    return selectedCount > 0 && selectedCount < compoundCellIds.length;
  };

  const isAllSelected = () => {
    const site = sites.find(s => s.id === selectedSiteId);
    const allCellIds: string[] = [];
    site?.compounds?.forEach((compound: any) => {
      compound.cells?.forEach((cell: any) => {
        allCellIds.push(cell.id);
      });
    });
    return allCellIds.length > 0 && allCellIds.every(id => selectedCellIds.includes(id));
  };

  // Get selected cell names for display
  const getSelectedCellNames = () => {
    const names: string[] = [];
    const selectedSite = sites.find(s => s.id === selectedSiteId);
    selectedSite?.compounds?.forEach((compound: any) => {
      compound.cells?.forEach((cell: any) => {
        if (selectedCellIds.includes(cell.id)) {
          names.push(cell.name);
        }
      });
    });
    return names;
  };

  const selectedSite = sites.find(s => s.id === selectedSiteId);

  // Prepare chart data with dynamic formatting based on date range
  const getDateFormat = () => {
    switch (dateRange) {
      case '7days':
        return 'MMM dd';
      case 'month':
        return 'MMM dd';
      case 'year':
        return 'MMM yyyy';
      default:
        return 'MMM dd';
    }
  };

  // Color palette for commodity markers
  const commodityColors = [
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EF4444', // Red
    '#14B8A6', // Teal
  ];

  // Helper function to get data for a specific cell
  const getCellData = (cellId: string) => {
    const cell = cellsDetails?.cells.find(c => c.id === cellId);
    const sensorReadings = cellsDetails?.sensorReadings.filter(r => r.cellId === cellId) || [];
    const trades = cellsDetails?.trades.filter(t => t.cellId === cellId) || [];
    const alerts = cellsDetails?.alerts.filter(a => a.cellId === cellId) || [];

    // Sort trades by date to determine which commodity was active when
    const sortedTrades = [...trades].sort((a, b) =>
      new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime()
    );

    // Function to find which commodity was active at a given time
    const getCommodityAtTime = (timestamp: string) => {
      const time = new Date(timestamp).getTime();
      // Find the most recent trade before or at this time
      for (let i = sortedTrades.length - 1; i >= 0; i--) {
        if (new Date(sortedTrades[i].tradedAt).getTime() <= time) {
          return sortedTrades[i].commodity.commodityType?.name || sortedTrades[i].commodity.name || 'Unknown';
        }
      }
      return 'No commodity';
    };

    // Group and average data by formatted date to avoid duplicates
    const tempReadings = sensorReadings.filter(r => r.metric === 'TEMPERATURE');
    const tempByDate = new Map<string, { sum: number; count: number; fullDate: string }>();

    tempReadings.forEach(r => {
      const dateKey = format(new Date(r.recordedAt), getDateFormat());
      if (!tempByDate.has(dateKey)) {
        tempByDate.set(dateKey, { sum: 0, count: 0, fullDate: r.recordedAt });
      }
      const entry = tempByDate.get(dateKey)!;
      entry.sum += r.value;
      entry.count += 1;
    });

    const temperatureData = Array.from(tempByDate.entries())
      .map(([date, data]) => ({
        date,
        fullDate: data.fullDate,
        temperature: parseFloat((data.sum / data.count).toFixed(2)),
        commodity: getCommodityAtTime(data.fullDate),
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    // Same for humidity
    const humidityReadings = sensorReadings.filter(r => r.metric === 'HUMIDITY');
    const humidityByDate = new Map<string, { sum: number; count: number; fullDate: string }>();

    humidityReadings.forEach(r => {
      const dateKey = format(new Date(r.recordedAt), getDateFormat());
      if (!humidityByDate.has(dateKey)) {
        humidityByDate.set(dateKey, { sum: 0, count: 0, fullDate: r.recordedAt });
      }
      const entry = humidityByDate.get(dateKey)!;
      entry.sum += r.value;
      entry.count += 1;
    });

    const humidityData = Array.from(humidityByDate.entries())
      .map(([date, data]) => ({
        date,
        fullDate: data.fullDate,
        humidity: parseFloat((data.sum / data.count).toFixed(2)),
        commodity: getCommodityAtTime(data.fullDate),
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

    const tempValues = temperatureData.map(d => d.temperature);
    const humidityValues = humidityData.map(d => d.humidity);

    const tempMin = tempValues.length > 0 ? Math.floor(Math.min(...tempValues)) - 2 : 0;
    const tempMax = tempValues.length > 0 ? Math.ceil(Math.max(...tempValues)) + 2 : 100;
    const humidityMin = humidityValues.length > 0 ? Math.floor(Math.min(...humidityValues)) - 1 : 0;
    const humidityMax = humidityValues.length > 0 ? Math.ceil(Math.max(...humidityValues)) + 1 : 100;

    // Get commodity markers for the chart - filter duplicates by commodity type
    const uniqueMarkers = new Map<string, { date: string; fullDate: string; commodity: string; color: string }>();

    trades
      .sort((a, b) => new Date(a.tradedAt).getTime() - new Date(b.tradedAt).getTime())
      .forEach((trade, index) => {
        const commodityName = trade.commodity.commodityType?.name || trade.commodity.name || 'Unknown';
        if (!uniqueMarkers.has(commodityName)) {
          uniqueMarkers.set(commodityName, {
            date: format(new Date(trade.tradedAt), getDateFormat()),
            fullDate: trade.tradedAt,
            commodity: commodityName,
            color: commodityColors[index % commodityColors.length],
          });
        }
      });

    const commodityMarkers = Array.from(uniqueMarkers.values());

    return {
      temperatureData,
      humidityData,
      tempMin,
      tempMax,
      humidityMin,
      humidityMax,
      trades,
      alerts,
      commodityMarkers,
    };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addSiteButton')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Site Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('site')}</label>
            <Select value={selectedSiteId} onValueChange={handleSiteChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectSite')} />
              </SelectTrigger>
              <SelectContent>
                {sites.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cell Multi-Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('cell')}</label>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between" disabled={!selectedSiteId}>
                  {selectedCellIds.length > 0
                    ? `${selectedCellIds.length} cell${selectedCellIds.length > 1 ? 's' : ''} selected`
                    : t('selectCell')}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[300px] max-h-[400px] overflow-y-auto"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                {/* Select All Option */}
                <DropdownMenuCheckboxItem
                  checked={isAllSelected()}
                  onCheckedChange={handleSelectAll}
                  onSelect={(e) => e.preventDefault()}
                  className="font-semibold"
                >
                  Select All
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />

                {/* Compounds and Cells */}
                {selectedSite?.compounds?.map((compound: any) => (
                  <div key={compound.id}>
                    {/* Compound Checkbox */}
                    <div className="flex items-center px-2 py-1.5 hover:bg-accent cursor-pointer" onClick={() => handleCompoundToggle(compound.id)}>
                      <Checkbox
                        checked={isCompoundSelected(compound.id)}
                        onCheckedChange={() => handleCompoundToggle(compound.id)}
                        className="mr-2"
                        {...(isCompoundIndeterminate(compound.id) && {
                          'data-state': 'indeterminate' as any
                        })}
                      />
                      <span className="text-xs font-semibold text-muted-foreground uppercase">
                        {compound.name}
                      </span>
                    </div>

                    {/* Cells under compound */}
                    {compound.cells?.map((cell: any) => (
                      <DropdownMenuCheckboxItem
                        key={cell.id}
                        checked={selectedCellIds.includes(cell.id)}
                        onCheckedChange={() => handleCellToggle(cell.id)}
                        onSelect={(e) => e.preventDefault()}
                        className="pl-8"
                      >
                        {cell.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedCellIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {getSelectedCellNames().join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-8">
          {/* Skeleton for each cell section */}
          {[1, 2].map((index) => (
            <div key={index} className="space-y-4">
              {/* Cell title skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>

              {/* Charts skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                  </CardContent>
                </Card>
              </div>

              {/* Info cards skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      ) : cellsDetails ? (
        <>
          {/* Global Title and Date Range */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {cellsDetails.cells.length} Cell{cellsDetails.cells.length > 1 ? 's' : ''} Selected
              </h2>
              <p className="text-sm text-muted-foreground">
                {cellsDetails.cells.map(c => c.name).join(', ')}
              </p>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-end gap-4 ml-auto">
              <div className="w-[125px]">
                <label className="text-sm font-medium mb-2 block">{t('dateRange')}</label>
                <div>
                  <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">{t('last7Days')}</SelectItem>
                      <SelectItem value="month">{t('lastMonth')}</SelectItem>
                      <SelectItem value="year">{t('lastYear')}</SelectItem>
                      <SelectItem value="custom">{t('custom')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {dateRange === 'custom' && (
                <>
                  <div className="w-[150px]">
                    <label className="text-sm font-medium mb-2 block">{t('startDate')}</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-[150px]">
                    <label className="text-sm font-medium mb-2 block">{t('endDate')}</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Render separate sections for each cell */}
          {cellsDetails.cells.map((cell, index) => {
            const cellData = getCellData(cell.id);
            return (
              <div key={cell.id} className={index > 0 ? 'mt-8' : ''}>
                {/* Cell Title */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {cell.name} - {cell.compound.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{cell.compound.site.name}</p>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Temperature Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('temperatureTrends')}</CardTitle>
                      <CardDescription>{t('temperatureLabel')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={cellData.temperatureData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis
                                stroke="#9CA3AF"
                                domain={[cellData.tempMin, cellData.tempMax]}
                                label={{ value: '°C', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                                labelStyle={{ color: '#E5E7EB' }}
                                formatter={(value: any, name: any, props: any) => [
                                  `${value}°C`,
                                  'Temperature'
                                ]}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-lg">
                                        <p className="text-gray-200 text-sm font-medium">{data.date}</p>
                                        <p className="text-emerald-400 text-sm">{`Temperature: ${data.temperature}°C`}</p>
                                        <p className="text-amber-400 text-sm font-semibold">{`Commodity: ${data.commodity}`}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend />

                              {/* Commodity change markers - more prominent */}
                              {cellData.commodityMarkers.map((marker, idx) => (
                                <ReferenceLine
                                  key={`marker-${idx}-${marker.commodity}`}
                                  x={marker.date}
                                  stroke={marker.color}
                                  strokeWidth={4}
                                  strokeDasharray="6 3"
                                  opacity={1}
                                  ifOverflow="extendDomain"
                                  label={{
                                    value: '▼',
                                    position: 'top',
                                    fill: marker.color,
                                    fontSize: 16,
                                  }}
                                />
                              ))}

                              <Line
                                type="monotone"
                                dataKey="temperature"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={{ fill: '#10B981' }}
                                name="Temperature (°C)"
                              />
                            </LineChart>
                          </ResponsiveContainer>

                          {/* Commodity Legend */}
                          {cellData.commodityMarkers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Commodity Timeline:</p>
                              <div className="flex flex-wrap gap-3">
                                {cellData.commodityMarkers.map((marker, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-sm border-2"
                                      style={{
                                        borderColor: marker.color,
                                        backgroundColor: `${marker.color}20`
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {marker.commodity} ({format(new Date(marker.fullDate), 'dd/MM/yyyy')})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                    </CardContent>
                  </Card>

                  {/* Humidity Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('humidityTrends')}</CardTitle>
                      <CardDescription>{t('humidityLabel')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={cellData.humidityData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis
                                stroke="#9CA3AF"
                                domain={[cellData.humidityMin, cellData.humidityMax]}
                                label={{ value: '%', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                                labelStyle={{ color: '#E5E7EB' }}
                                formatter={(value: any, name: any, props: any) => [
                                  `${value}%`,
                                  'Humidity'
                                ]}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-gray-800 border border-gray-700 p-2 rounded shadow-lg">
                                        <p className="text-gray-200 text-sm font-medium">{data.date}</p>
                                        <p className="text-blue-400 text-sm">{`Humidity: ${data.humidity}%`}</p>
                                        <p className="text-amber-400 text-sm font-semibold">{`Commodity: ${data.commodity}`}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend />

                              {/* Commodity change markers - more prominent */}
                              {cellData.commodityMarkers.map((marker, idx) => (
                                <ReferenceLine
                                  key={`marker-${idx}-${marker.commodity}`}
                                  x={marker.date}
                                  stroke={marker.color}
                                  strokeWidth={4}
                                  strokeDasharray="6 3"
                                  opacity={1}
                                  ifOverflow="extendDomain"
                                  label={{
                                    value: '▼',
                                    position: 'top',
                                    fill: marker.color,
                                    fontSize: 16,
                                  }}
                                />
                              ))}

                              <Line
                                type="monotone"
                                dataKey="humidity"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={{ fill: '#3B82F6' }}
                                name="Humidity (%)"
                              />
                            </LineChart>
                          </ResponsiveContainer>

                          {/* Commodity Legend */}
                          {cellData.commodityMarkers.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Commodity Timeline:</p>
                              <div className="flex flex-wrap gap-3">
                                {cellData.commodityMarkers.map((marker, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-sm border-2"
                                      style={{
                                        borderColor: marker.color,
                                        backgroundColor: `${marker.color}20`
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                      {marker.commodity} ({format(new Date(marker.fullDate), 'dd/MM/yyyy')})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Goods in Cell */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('goodsInCell')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {cellData.trades.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('noDataAvailable')}</p>
                      ) : (
                        <div className="space-y-4">
                          {cellData.trades.map(trade => (
                            <div key={trade.id} className="border-b border-border pb-4 last:border-0">
                              <h4 className="font-medium">{trade.commodity.commodityType?.name || trade.commodity.name || 'Unknown'}</h4>
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <p>{t('location')}: {trade.commodity.origin || 'N/A'}</p>
                                <p>{t('quantity')}: {trade.amountKg.toLocaleString()} kg</p>
                                <p>{t('arrivalDate')}: {format(new Date(trade.tradedAt), 'dd/MM/yyyy')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Active Alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('activeAlerts')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {cellData.alerts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t('noDataAvailable')}</p>
                      ) : (
                        <div className="space-y-4">
                          {cellData.alerts.map(alert => (
                            <div key={alert.id} className="border-b border-border pb-4 last:border-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-medium">{alert.title || alert.description}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {alert.thresholdValue && alert.unit
                                      ? `${t('temperatureLabel').split(' ')[0]} ${alert.thresholdValue}${alert.unit}`
                                      : alert.description
                                    }
                                  </p>
                                </div>
                                <Badge
                                  variant={alert.status === 'OPEN' ? 'default' : 'secondary'}
                                  className={
                                    alert.status === 'OPEN'
                                      ? 'bg-blue-600 hover:bg-blue-700'
                                      : ''
                                  }
                                >
                                  {tStatus(alert.status)}
                                </Badge>
                              </div>
                              <Badge
                                variant="outline"
                                className="mt-2 border-red-500 text-red-500"
                              >
                                {tSeverity(alert.severity)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {t('selectCell')}
        </div>
      )}
    </div>
  );
}
