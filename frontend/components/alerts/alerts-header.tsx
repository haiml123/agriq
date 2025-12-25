import { useTranslations } from 'next-intl';

export function AlertsHeader() {
  const t = useTranslations('pages.alerts');

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
    </div>
  );
}
