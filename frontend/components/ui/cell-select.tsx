'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export interface CellSelectSite {
  id: string;
  name: string;
  compounds?: CellSelectCompound[];
}

export interface CellSelectCompound {
  id: string;
  name: string;
  cells?: CellSelectCell[];
}

export interface CellSelectCell {
  id: string;
  name: string;
}

interface CellSelectProps {
  sites: CellSelectSite[];
  selectedSiteId?: string;
  selectedCompoundId?: string;
  selectedCellIds: string[];
  onCellSelectionChange: (cellIds: string[]) => void;
  multiSelect?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  disableCompoundToggle?: boolean;
}

export function CellSelect({
  sites,
  selectedSiteId,
  selectedCompoundId,
  selectedCellIds,
  onCellSelectionChange,
  multiSelect = false,
  disabled = false,
  placeholder = 'Select cell',
  className = '',
  disableCompoundToggle = false,
}: CellSelectProps) {
  const t = useTranslations('sites');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get the selected site's compounds and cells
  const selectedSite = sites.find((s) => s.id === selectedSiteId);
  const compounds = selectedCompoundId && selectedCompoundId !== 'all'
    ? selectedSite?.compounds?.filter((c) => c.id === selectedCompoundId) || []
    : selectedSite?.compounds || [];

  // Handle cell selection/deselection
  const handleCellToggle = (cellId: string) => {
    if (multiSelect) {
      const newSelection = selectedCellIds.includes(cellId)
        ? selectedCellIds.filter((id) => id !== cellId)
        : [...selectedCellIds, cellId];
      onCellSelectionChange(newSelection);
    } else {
      // Single select mode - replace selection
      onCellSelectionChange([cellId]);
      setDropdownOpen(false);
    }
  };

  // Handle compound selection (select/deselect all cells in compound)
  const handleCompoundToggle = (compoundId: string) => {
    if (!multiSelect) return; // Only works in multi-select mode

    const compound = compounds.find((c) => c.id === compoundId);
    const compoundCellIds = compound?.cells?.map((cell) => cell.id) || [];

    const allSelected = compoundCellIds.every((id) =>
      selectedCellIds.includes(id)
    );

    if (allSelected) {
      // Deselect all cells in this compound
      onCellSelectionChange(
        selectedCellIds.filter((id) => !compoundCellIds.includes(id))
      );
    } else {
      // Select all cells in this compound
      onCellSelectionChange([
        ...new Set([...selectedCellIds, ...compoundCellIds]),
      ]);
    }
  };

  // Handle "Select All" toggle
  const handleSelectAll = () => {
    if (!multiSelect) return; // Only works in multi-select mode

    const allCellIds: string[] = [];
    compounds.forEach((compound) => {
      compound.cells?.forEach((cell) => {
        allCellIds.push(cell.id);
      });
    });

    const allSelected =
      allCellIds.length > 0 &&
      allCellIds.every((id) => selectedCellIds.includes(id));

    if (allSelected) {
      onCellSelectionChange([]);
    } else {
      onCellSelectionChange(allCellIds);
    }
  };

  // Check if all cells in a compound are selected
  const isCompoundSelected = (compoundId: string) => {
    if (!multiSelect) return false;

    const compound = compounds.find((c) => c.id === compoundId);
    const compoundCellIds = compound?.cells?.map((cell) => cell.id) || [];
    return (
      compoundCellIds.length > 0 &&
      compoundCellIds.every((id) => selectedCellIds.includes(id))
    );
  };

  // Check if some (but not all) cells in a compound are selected
  const isCompoundIndeterminate = (compoundId: string) => {
    if (!multiSelect) return false;

    const compound = compounds.find((c) => c.id === compoundId);
    const compoundCellIds = compound?.cells?.map((cell) => cell.id) || [];
    const selectedCount = compoundCellIds.filter((id) =>
      selectedCellIds.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < compoundCellIds.length;
  };

  // Check if all cells are selected
  const isAllSelected = () => {
    if (!multiSelect) return false;

    const allCellIds: string[] = [];
    compounds.forEach((compound) => {
      compound.cells?.forEach((cell) => {
        allCellIds.push(cell.id);
      });
    });
    return (
      allCellIds.length > 0 &&
      allCellIds.every((id) => selectedCellIds.includes(id))
    );
  };

  // Get display text for the button
  const getButtonText = () => {
    if (selectedCellIds.length === 0) {
      return placeholder;
    }

    if (multiSelect) {
      return t('cellsSelected', { count: selectedCellIds.length });
    }

    // Single select - show the cell name
    const selectedCell = compounds
      .flatMap((c) => c.cells || [])
      .find((cell) => cell.id === selectedCellIds[0]);
    return selectedCell?.name || placeholder;
  };

  // Get selected cell names for display below the dropdown
  const getSelectedCellNames = () => {
    if (!multiSelect || selectedCellIds.length === 0) return null;

    const names: string[] = [];
    compounds.forEach((compound) => {
      compound.cells?.forEach((cell) => {
        if (selectedCellIds.includes(cell.id)) {
          names.push(cell.name);
        }
      });
    });
    return names.join(', ');
  };

  return (
    <div className={className}>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled || !selectedSiteId || compounds.length === 0}
          >
            {getButtonText()}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[300px] max-h-[400px] overflow-y-auto"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {/* Select All Option (only in multi-select mode) */}
          {multiSelect && (
            <>
              <DropdownMenuCheckboxItem
                checked={isAllSelected()}
                onCheckedChange={handleSelectAll}
                onSelect={(e) => e.preventDefault()}
                className="font-semibold"
              >
                Select All
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Compounds and Cells */}
          {compounds.map((compound) => (
            <div key={compound.id}>
              {/* Compound Header (only in multi-select mode) */}
              {multiSelect && (
                <div
                  className={`flex items-center px-2 py-1.5 ${disableCompoundToggle ? '' : 'hover:bg-accent cursor-pointer'}`}
                  onClick={() => {
                    if (!disableCompoundToggle) {
                      handleCompoundToggle(compound.id);
                    }
                  }}
                >
                  {!disableCompoundToggle && (
                    <Checkbox
                      checked={isCompoundSelected(compound.id)}
                      onCheckedChange={() => handleCompoundToggle(compound.id)}
                      className="mr-2"
                      {...(isCompoundIndeterminate(compound.id) && {
                        'data-state': 'indeterminate',
                      })}
                    />
                  )}
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {compound.name}
                  </span>
                </div>
              )}

              {/* Compound Label (single-select mode) */}
              {!multiSelect && (
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase">
                  {compound.name}
                </DropdownMenuLabel>
              )}

              {/* Cells under compound */}
              {compound.cells?.map((cell) => (
                <DropdownMenuCheckboxItem
                  key={cell.id}
                  checked={selectedCellIds.includes(cell.id)}
                  onCheckedChange={() => handleCellToggle(cell.id)}
                  onSelect={(e) => e.preventDefault()}
                  className={multiSelect ? 'pl-8' : ''}
                >
                  {cell.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}

          {compounds.length === 0 && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No compounds/cells available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
