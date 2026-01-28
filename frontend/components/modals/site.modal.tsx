'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Site, UpdateSiteDto, updateSiteSchema } from '@/schemas/sites.schema';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LocaleTranslationsAccordion, type LocaleTranslations } from '@/components/shared/locale-translations-accordion';

interface SiteModalProps {
  site?: Site | null;
  onClose: (result?: UpdateSiteDto | null) => void;
}

export function SiteModal({ site, onClose }: SiteModalProps) {
  const t = useTranslations('modals.site');
  const tCommon = useTranslations('common');
  const isEdit = !!site?.id;
  const [localeValues, setLocaleValues] = useState<LocaleTranslations>(
    site?.locale ?? {}
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UpdateSiteDto>({
    resolver: zodResolver(updateSiteSchema),
    defaultValues: {
      name: site?.name ?? '',
      address: site?.address ?? '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: UpdateSiteDto) => {
    onClose({
      name: data.name,
      address: data.address || undefined,
      locale: localeValues,
    });
  };

  return (
      <>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('editDescription') : t('createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="siteName" className="text-sm font-medium text-foreground">
              {t('siteName')}
            </label>
            <Input
                id="siteName"
                placeholder={t('siteNamePlaceholder')}
                {...register('name')}
            />
            {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="siteAddress" className="text-sm font-medium text-foreground">
              {t('address')}
            </label>
            <Input
                id="siteAddress"
                placeholder={t('addressPlaceholder')}
                {...register('address')}
            />
            {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
            )}
          </div>
          <LocaleTranslationsAccordion value={localeValues} onChange={setLocaleValues} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              {tCommon('cancel')}
            </Button>
            <Button
                type="submit"
                disabled={!isValid}
                className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isEdit ? t('saveButton') : t('createButton')}
            </Button>
          </DialogFooter>
        </form>
      </>
  );
}
