import React, { useState } from 'react';
import {
  Cell,
  Compound,
  CreateCellDto,
  CreateCompoundDto,
  Site,
  UpdateCellDto,
  UpdateCompoundDto,
  UpdateSiteDto
} from '@/schemas/sites.schema';
import { SiteRow } from './site-row';
import { useModal } from '@/components/providers/modal-provider';
import { CellModal } from '@/components/modals/cell.modal';
import { CompoundModal } from '@/components/modals/compound.modal';
import { SiteModal } from '@/components/modals/site.modal';
import { DeleteConfirmModal } from '@/components/modals/delete-confirm.modal';

interface SitesListProps {
  sites: Site[];
  onEditSite?: (siteId: string, data: UpdateSiteDto) => void;
  onDeleteSite?: (siteId: string) => void;
  onCreateCompound?: (siteId: string, data: CreateCompoundDto) => void;
  onEditCompound?: (compoundId: string, data: UpdateCompoundDto) => void;
  onDeleteCompound?: (compoundId: string) => void;
  onCreateCell?: (compoundId: string, data: CreateCellDto) => void;
  onEditCell?: (cellId: string, data: UpdateCellDto) => void;
  onDeleteCell?: (cellId: string) => void;
}

export const SitesList: React.FC<SitesListProps> = ({
  sites,
  onEditSite,
  onDeleteSite,
  onCreateCompound,
  onEditCompound,
  onDeleteCompound,
  onCreateCell,
  onEditCell,
  onDeleteCell,
}) => {
  const modal = useModal();
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [expandedCompounds, setExpandedCompounds] = useState<Set<string>>(new Set());

  const toggleSite = (siteId: string) => {
    setExpandedSites((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) {
        next.delete(siteId);
      } else {
        next.add(siteId);
      }
      return next;
    });
  };

  const toggleCompound = (compoundId: string) => {
    setExpandedCompounds((prev) => {
      const next = new Set(prev);
      if (next.has(compoundId)) {
        next.delete(compoundId);
      } else {
        next.add(compoundId);
      }
      return next;
    });
  };

  const handleEditSite = async (site: Site) => {
    const result = await modal.open<UpdateSiteDto | null>((onClose) => (
        <SiteModal site={site} onClose={onClose} />
    ))
    if (result) {
      onEditSite?.(site.id, result);
    }
  };

  const handleDeleteSite = async (site: Site) => {
    const confirmed = await modal.open<boolean>((onClose) => (
        <DeleteConfirmModal itemType="Site" itemName={site.name} onClose={onClose} />
    ));
    if (confirmed) {
      onDeleteSite?.(site.id);
    }
  };

  // Compound handlers
  const handleCreateCompound = async (site: Site) => {
    const result = await modal.open<CreateCompoundDto | null>((onClose) => (
        <CompoundModal siteName={site.name} onClose={onClose} />
    ));
    if (result) {
      onCreateCompound?.(site.id, result);
    }
  };

  const handleEditCompound = async (compound: Compound) => {
    const result = await modal.open<UpdateCompoundDto | null>((onClose) => (
        <CompoundModal siteName="" compound={compound} onClose={onClose} />
    ));
    if (result) {
      onEditCompound?.(compound.id, result);
    }
  };

  const handleDeleteCompound = async (compound: Compound) => {
    const confirmed = await modal.open<boolean>((onClose) => (
        <DeleteConfirmModal itemType="Compound" itemName={compound.name} onClose={onClose} />
    ));
    if (confirmed) {
      onDeleteCompound?.(compound.id);
    }
  };

  // Cell handlers
  const handleCreateCell = async (compound: Compound) => {
    const result = await modal.open<CreateCellDto | UpdateCellDto | null>((onClose) => (
        <CellModal compoundName={compound.name} onClose={onClose} />
    ));
    if (result) {
      onCreateCell?.(compound.id, result as CreateCellDto);
    }
  };

  const handleEditCell = async (cell: Cell) => {
    const result = await modal.open<UpdateCellDto | null>((onClose) => (
        <CellModal compoundName="" cell={cell} onClose={onClose} />
    ));
    if (result) {
      onEditCell?.(cell.id, result);
    }
  };

  const handleDeleteCell = async (cell: Cell) => {
    const confirmed = await modal.open<boolean>((onClose) => (
        <DeleteConfirmModal itemType="Cell" itemName={cell.name} onClose={onClose} />
    ));
    if (confirmed) {
      onDeleteCell?.(cell.id);
    }
  };

  return (
      <div className="divide-y divide-border">
        {sites.map((site, idx) => (
            <SiteRow
                key={site.id}
                site={site}
                isExpanded={expandedSites.has(site.id)}
                onToggle={() => toggleSite(site.id)}
                expandedCompounds={expandedCompounds}
                onToggleCompound={toggleCompound}
                isLast={idx === sites.length - 1}
                onCreateCompound={() => handleCreateCompound(site)}
                onEditSite={() => handleEditSite(site)}
                onDeleteSite={() => handleDeleteSite(site)}
                onCreateCell={handleCreateCell}
                onEditCompound={handleEditCompound}
                onDeleteCompound={handleDeleteCompound}
                onEditCell={handleEditCell}
                onDeleteCell={handleDeleteCell}
            />
        ))}
      </div>
  );
};