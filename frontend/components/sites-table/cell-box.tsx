import React from 'react';
import { Box, Droplets, Package, Thermometer, Trash2 } from 'lucide-react';
import { Cell } from '@/schemas/sites.schema';
import { StatusDot } from '@/components/ui/status-indicator';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface CellBoxProps {
  cell: Cell;
  onEdit: () => void;
  onDelete: () => void;
}

export const CellBox: React.FC<CellBoxProps> = ({ cell, onEdit, onDelete }) => {
  const t = useTranslations('sites');
  const hasGateway = Boolean(cell.gateways && cell.gateways.length > 0);
  cell.temp = 30;
  cell.humidity = 50;
  return (
      <div
          className="p-3 bg-card rounded-lg flex flex-col gap-4 border border-border hover:bg-muted/30 transition-all cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Box size={12} className="text-violet-500 flex-shrink-0" />
            <span className="text-foreground font-medium text-sm truncate">{cell.name}</span>
          </div>
          <StatusDot status={cell.status} />
        </div>

        <div className="flex items-center justify-center gap-2">
          {cell.temp !== undefined && (
              <div className="flex items-center gap-1">
                <Thermometer size={11} className="text-orange-500" />
                <span>{cell.temp}°C</span>
              </div>
          )}
          {cell.humidity !== undefined && (
              <div className="flex items-center gap-1">
                <Droplets size={11} className="text-sky-500" />
                <span>{cell.humidity}%</span>
              </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {cell.capacity && (
                <div className="flex items-center gap-1">
                  <Package size={11} />
                  <span>{cell.capacity}</span>
                </div>
            )}
            <span className={hasGateway ? 'text-emerald-500' : 'text-muted-foreground'}>
              {hasGateway ? t('gatewayPaired') : t('gatewayUnpaired')}
            </span>
          </div>
          <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground justify-end hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
  );
};
