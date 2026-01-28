"use client";

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useApp } from '@/providers/app-provider';
import { CommodityModal } from '@/components/modals/commodity.modal';
import { SitesHeader } from './sites-header';
import { SitesFilters } from './sites-filters';
import { CellSection } from './cell-section';
import { CellSectionSkeleton } from './skeletons/cell-section-skeleton';
import { useSitesData, useCellsDetails } from './hooks/use-sites-data';
import { useSitesFilters } from './hooks/use-sites-filters';
import { useTranslationMap } from '@/hooks/use-translation-map';
import { resolveLocaleText } from '@/utils/locale';
import type { MultipleCellsDetails, SensorReading, Trade, Alert } from './types';
import { toast } from 'sonner';

const exportHeaders = [
  'Site',
  'Compound',
  'Cell',
  'Latest Temperature (C)',
  'Latest Humidity (%)',
  'Trades Count',
  'Total Traded (kg)',
  'Alerts Count',
];

const escapeCsvValue = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getLatestReadings = (readings: SensorReading[]) => {
  const latest = new Map<string, SensorReading>();
  readings.forEach((reading) => {
    const current = latest.get(reading.cellId);
    if (!current || new Date(reading.recordedAt).getTime() > new Date(current.recordedAt).getTime()) {
      latest.set(reading.cellId, reading);
    }
  });
  return latest;
};

const getTradeSummary = (trades: Trade[]) => {
  const summary = new Map<string, { count: number; totalKg: number }>();
  trades.forEach((trade) => {
    const current = summary.get(trade.cellId) || { count: 0, totalKg: 0 };
    summary.set(trade.cellId, {
      count: current.count + 1,
      totalKg: current.totalKg + trade.amountKg,
    });
  });
  return summary;
};

const getAlertSummary = (alerts: Alert[]) => {
  const summary = new Map<string, number>();
  alerts.forEach((alert) => {
    summary.set(alert.cellId, (summary.get(alert.cellId) || 0) + 1);
  });
  return summary;
};

const buildExportRows = (cellsDetails: MultipleCellsDetails, locale: string) => {
  const latestReadings = getLatestReadings(cellsDetails.sensorReadings);
  const tradeSummary = getTradeSummary(cellsDetails.trades);
  const alertSummary = getAlertSummary(cellsDetails.alerts);

  return cellsDetails.cells.map((cell) => {
    const reading = latestReadings.get(cell.id);
    const trades = tradeSummary.get(cell.id);
    const alertsCount = alertSummary.get(cell.id) || 0;

    return {
      site: resolveLocaleText(cell.compound.site?.locale, locale, cell.compound.site.name),
      compound: resolveLocaleText(cell.compound?.locale, locale, cell.compound.name),
      cell: resolveLocaleText(cell.locale, locale, cell.name),
      temperature: reading?.temperature?.toString() || '',
      humidity: reading?.humidity?.toString() || '',
      tradesCount: trades?.count?.toString() || '0',
      totalTradedKg: trades?.totalKg?.toString() || '0',
      alertsCount: alertsCount.toString(),
    };
  });
};

export function SitesPage() {
  const t = useTranslations('sites');
  const locale = useLocale();
  const resolveCommodityTypeName = useTranslationMap('commodity_type', locale);
  const { user } = useApp();
  const [commodityModalOpen, setCommodityModalOpen] = useState(false);

  // Load sites
  const { sites } = useSitesData();

  // Manage filters
  const filters = useSitesFilters(sites);

  // Load cell details
  const { cellsDetails, loading, reloadCellsDetails } = useCellsDetails(
    filters.selectedCellIds,
    filters.dateRange,
    filters.customStartDate,
    filters.customEndDate
  );


  const handleCommoditySuccess = () => {
    setCommodityModalOpen(false);
    reloadCellsDetails();
  };

  const handleExportCsv = () => {
    if (!cellsDetails || cellsDetails.cells.length === 0) {
      toast.error('No data to export');
      return;
    }

    const rows = buildExportRows(cellsDetails, locale);
    const lines = [
      exportHeaders.join(','),
      ...rows.map((row) =>
        [
          row.site,
          row.compound,
          row.cell,
          row.temperature,
          row.humidity,
          row.tradesCount,
          row.totalTradedKg,
          row.alertsCount,
        ]
          .map((value) => escapeCsvValue(value))
          .join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sites-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!cellsDetails || cellsDetails.cells.length === 0) {
      toast.error('No data to export');
      return;
    }

    const rows = buildExportRows(cellsDetails, locale);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');

    if (!printWindow) {
      toast.error('Popup blocked');
      return;
    }

    const tableRows = rows
      .map((row) => {
        const values = [
          row.site,
          row.compound,
          row.cell,
          row.temperature,
          row.humidity,
          row.tradesCount,
          row.totalTradedKg,
          row.alertsCount,
        ];
        return `<tr>${values.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Sites Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 18px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #d4d4d4; padding: 6px 8px; text-align: left; }
            th { background: #f4f4f5; }
          </style>
        </head>
        <body>
          <h1>Sites Export</h1>
          <table>
            <thead>
              <tr>${exportHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <SitesHeader
        onAddCommodity={() => setCommodityModalOpen(true)}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />

      <SitesFilters
        sites={sites}
        selectedSiteId={filters.selectedSiteId}
        selectedCompoundId={filters.selectedCompoundId}
        selectedCellIds={filters.selectedCellIds}
        dateRange={filters.dateRange}
        customStartDate={filters.customStartDate}
        customEndDate={filters.customEndDate}
        onSiteChange={filters.handleSiteChange}
        onCompoundChange={filters.handleCompoundChange}
        onCellSelectionChange={filters.handleCellSelectionChange}
        onDateRangeChange={filters.setDateRange}
        onCustomStartDateChange={filters.setCustomStartDate}
        onCustomEndDateChange={filters.setCustomEndDate}
      />

      {loading ? (
        <CellSectionSkeleton />
      ) : cellsDetails ? (
        <>
          {/* Render cell sections */}
          {cellsDetails.cells.map((cell, index) => (
            <CellSection
              key={cell.id}
              cell={cell}
              cellsDetails={cellsDetails}
              dateRange={filters.dateRange}
              isFirst={index === 0}
              resolveCommodityTypeName={resolveCommodityTypeName}
            />
          ))}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          {t('selectCell')}
        </div>
      )}

      {/* Commodity Modal */}
      <CommodityModal
        open={commodityModalOpen}
        onClose={() => setCommodityModalOpen(false)}
        onSuccess={handleCommoditySuccess}
        organizationId={user?.organizationId || undefined}
      />
    </div>
  );
}
