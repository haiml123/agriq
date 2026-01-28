import React from 'react';
import { useLocale } from 'next-intl';
import { Building2, ChevronDown, ChevronRight, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Cell, Compound, Site } from '@/schemas/sites.schema';
import { CompoundRow } from '@/components/sites-table/compound-row';
import { Button } from '@/components/ui/button';
import { resolveLocaleText } from '@/utils/locale';

interface SiteRowProps {
  site: Site;
  displayName?: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedCompounds: Set<string>;
  onToggleCompound: (compoundId: string) => void;
  isLast: boolean;
  onCreateCompound: () => void;
  onEditSite: () => void;
  onDeleteSite: () => void;
  onCreateCell: (compound: Compound) => void;
  onEditCompound: (compound: Compound) => void;
  onDeleteCompound: (compound: Compound) => void;
  onEditCell: (cell: Cell) => void;
  onDeleteCell: (cell: Cell) => void;
}

export const SiteRow: React.FC<SiteRowProps> = ({
  site,
  displayName,
  isExpanded,
  onToggle,
  expandedCompounds,
  onToggleCompound,
  isLast,
  onCreateCompound,
  onEditSite,
  onDeleteSite,
  onCreateCell,
  onEditCompound,
  onDeleteCompound,
  onEditCell,
  onDeleteCell,
}) => {
  const locale = useLocale();
  const allCells = site.compounds?.flatMap((c) => c.cells) ?? [];
  const totalCells = allCells.length;
  const resolvedSiteName = displayName ?? resolveLocaleText(site.locale, locale, site.name);

  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <button className="p-0.5">
            {isExpanded ? (
              <ChevronDown size={18} className="text-muted-foreground" />
            ) : (
              <ChevronRight size={18} className="text-muted-foreground" />
            )}
          </button>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Building2 size={18} className="text-emerald-500" />
          </div>
          <div>
            <span className="text-foreground font-semibold block">{resolvedSiteName}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {site.compounds?.length ?? 0} compounds
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {totalCells} cells
              </span>
            </div>
            {site.address && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{site?.address}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCompound();
            }}
            className="text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10"
            title="Add Compound"
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEditSite();
            }}
            title="Edit Site"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSite();
            }}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete Site"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {isExpanded && site.compounds && (
        <div className="border-t border-border bg-muted/20">
          {site.compounds.map((compound, idx) => (
            <CompoundRow
              key={compound.id}
              compound={compound}
              isExpanded={expandedCompounds.has(compound.id)}
              onToggle={() => onToggleCompound(compound.id)}
              isLast={idx === (site.compounds?.length ?? 0) - 1}
              onCreateCell={() => onCreateCell(compound)}
              onEditCompound={() => onEditCompound(compound)}
              onDeleteCompound={() => onDeleteCompound(compound)}
              onEditCell={onEditCell}
              onDeleteCell={onDeleteCell}
            />
          ))}
        </div>
      )}
    </div>
  );
};
