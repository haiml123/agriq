'use client';

import { SidebarTrigger } from '@/components/layout/app-sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';

export function UpdatesPage() {
  const t = useTranslations('adminUpdates');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gateway-tar">{t('fileLabel')}</Label>
            <Input id="gateway-tar" type="file" accept=".tar" />
            <p className="text-xs text-muted-foreground">{t('fileHelper')}</p>
          </div>
          <Button type="button" disabled>
            {t('uploadButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
