import { Button } from '@/components/ui/button';
import { Building2, MapPin, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Organization } from '../types';

interface OrganizationsListProps {
  organizations: Organization[];
  onDelete: (id: string) => void;
  onCreateClick: () => void;
}

export function OrganizationsList({
  organizations,
  onDelete,
  onCreateClick,
}: OrganizationsListProps) {
  const t = useTranslations('admin.organizations');

  if (organizations.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-foreground mb-1">{t('noOrganizations')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('getStarted')}
        </p>
        <Button onClick={onCreateClick} className="bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" />
          {t('createOrganization')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">{t('allOrganizations')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('organizationsCount', { count: organizations.length })}
        </p>
      </div>

      <div className="divide-y divide-border">
        {organizations.map((org) => (
          <div key={org.id} className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground truncate">{org.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('created', { date: org.createdAt ?? new Date() })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{t('sitesCount', { count: 0 })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{t('usersCount', { count: 0 })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(org.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
