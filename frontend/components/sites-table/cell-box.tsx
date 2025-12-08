import React from 'react';
import { Box, Droplets, Pencil, Thermometer, Trash2 } from 'lucide-react';
import { Cell } from '@/schemas/sites.schema';
import { StatusDot } from '@/components/ui/status-indicator';
import { Button } from '@/components/ui/button';

interface CellBoxProps {
  cell: Cell;
  onEdit: () => void;
  onDelete: () => void;
}

export const CellBox: React.FC<CellBoxProps> = ({ cell, onEdit, onDelete }) => {
  return (
    <div className="p-3 bg-card rounded-lg border border-border hover:bg-muted/30 transition-all cursor-pointer">
      <div className="flex justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Box size={12} className="text-violet-500 flex-shrink-0" />
            <span className="text-foreground font-medium text-sm truncate">{cell.name}</span>
          </div>
          {cell.capacity && <div className="text-xs text-muted-foreground mb-2">{cell.capacity}</div>}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        </div>

        <div className="flex flex-col items-center justify-between">
          <StatusDot status={cell.status} />
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
