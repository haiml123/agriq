import React from 'react';
import { useLocale } from 'next-intl';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, Warehouse } from 'lucide-react';
import { Cell, Compound } from '@/schemas/sites.schema';
import { CellBox } from '@/components/sites-table/cell-box';
import { Button } from '@/components/ui/button';
import { resolveLocaleText } from '@/utils/locale';

interface CompoundRowProps {
  compound: Compound;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
  onCreateCell: () => void;
  onEditCompound: () => void;
  onDeleteCompound: () => void;
  onEditCell: (cell: Cell) => void;
  onDeleteCell: (cell: Cell) => void;
}

export const CompoundRow: React.FC<CompoundRowProps> = ({
  compound,
  isExpanded,
  onToggle,
  isLast,
  onCreateCell,
  onEditCompound,
  onDeleteCompound,
  onEditCell,
  onDeleteCell,
}) => {
  const locale = useLocale();
  return (
    <div className={`${!isLast ? 'border-b border-border' : ''}`}>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <button className="p-0.5 ml-6">
            {isExpanded ? (
              <ChevronDown size={16} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={16} className="text-muted-foreground" />
            )}
          </button>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Warehouse size={14} className="text-cyan-500" />
          </div>
          <span className="text-foreground font-medium">
            {resolveLocaleText(compound.locale, locale, compound.name)}
          </span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {compound?.cells?.length || 0} cells
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCell();
            }}
            className="text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10"
            title="Add Cell"
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEditCompound();
            }}
            title="Edit Compound"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCompound();
            }}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete Compound"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 ml-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {compound?.cells?.map((cell) => (
              <CellBox
                key={cell.id}
                cell={cell}
                onEdit={() => onEditCell(cell)}
                onDelete={() => onDeleteCell(cell)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
