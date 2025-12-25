'use client';

import { useModal } from '@/components/providers/modal-provider';
import { CreateOrganizationModal } from '@/components/modals/create-org.modal';
import { OrganizationsHeader } from './components/organizations-header';
import { OrganizationsList } from './components/organizations-list';
import { useOrganizationsData } from './hooks/use-organizations-data';

export function OrganizationsPage() {
  const modal = useModal();
  const {
    organizations,
    isCreating,
    handleCreateOrganization,
    handleDeleteOrganization,
  } = useOrganizationsData();

  const createOrg = async () => {
    const result = await modal.open<string>((onClose) => (
      <CreateOrganizationModal onClose={onClose} />
    ));
    if (result) {
      await handleCreateOrganization(result);
    }
  };

  return (
    <div className="space-y-6">
      <OrganizationsHeader onCreateClick={createOrg} isCreating={isCreating} />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <OrganizationsList
          organizations={organizations}
          onDelete={handleDeleteOrganization}
          onCreateClick={createOrg}
        />
      </div>
    </div>
  );
}
