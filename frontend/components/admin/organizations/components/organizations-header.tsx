import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { useTranslations } from 'next-intl';

interface OrganizationsHeaderProps {
  onCreateClick: () => void;
  isCreating: boolean;
}

export function OrganizationsHeader({ onCreateClick, isCreating }: OrganizationsHeaderProps) {
  const t = useTranslations('admin.organizations');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
      </div>
      <Button
        isLoading={isCreating}
        onClick={onCreateClick}
        className="bg-emerald-500 hover:bg-emerald-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        {t('createOrganization')}
      </Button>
    </div>
  );
}
