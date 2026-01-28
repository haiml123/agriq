'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Compound, CreateCompoundDto, createCompoundSchema } from '@/schemas/sites.schema';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { LocaleTranslationsAccordion, type LocaleTranslations } from '@/components/shared/locale-translations-accordion';

interface CompoundModalProps {
  siteName: string;
  compound?: Partial<Compound> | null;
  onClose: (result?: CreateCompoundDto | null) => void;
}

export function CompoundModal({ siteName, compound, onClose }: CompoundModalProps) {
  const t = useTranslations('modals.compound');
  const tCommon = useTranslations('common');
  const isEdit = !!(compound && compound.id);
  const [localeValues, setLocaleValues] = useState<LocaleTranslations>(
    compound?.locale ?? {}
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateCompoundDto>({
    resolver: zodResolver(createCompoundSchema),
    defaultValues: {
      name: compound?.name ?? '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: CreateCompoundDto) => {
    onClose({
      ...data,
      locale: localeValues,
    });
  };

  console.log(errors, isValid)

  return (
      <>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('editTitle') : t('createTitle', { siteName })}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('editDescription') : t('createDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="compoundName" className="text-sm font-medium text-foreground">
              {t('compoundName')}
            </label>
            <Input
                id="compoundName"
                placeholder={t('compoundNamePlaceholder')}
                {...register('name')}
            />
            {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
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
