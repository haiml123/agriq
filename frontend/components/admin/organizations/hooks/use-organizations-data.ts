import { useState, useEffect } from 'react';
import { useOrganizationApi } from '@/hooks';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import type { Organization } from '../types';

export function useOrganizationsData() {
  const t = useTranslations('toast.organization');
  const { create, getList, isLoading, isCreating } = useOrganizationApi();
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    const response = await getList();
    if (response?.data?.items) {
      setOrganizations(response.data.items);
    }
  };

  const handleCreateOrganization = async (name: string) => {
    if (!name.trim()) return;

    try {
      const result = await create({ name });

      if (result?.data) {
        toast.success(t('createSuccess'));
        await loadOrganizations();
        return true;
      } else {
        toast.error(result?.error || t('createError'));
        return false;
      }
    } catch (error) {
      toast.error(t('createError'));
      return false;
    }
  };

  const handleDeleteOrganization = (id: string) => {
    setOrganizations(organizations.filter((org) => org.id !== id));
  };

  return {
    organizations,
    isLoading,
    isCreating,
    handleCreateOrganization,
    handleDeleteOrganization,
    reloadOrganizations: loadOrganizations,
  };
}
