'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type LocaleTranslations = {
  en?: string;
  he?: string;
  ar?: string;
  th?: string;
};

interface LocaleTranslationsAccordionProps {
  label?: string;
  value: LocaleTranslations;
  onChange: (value: LocaleTranslations) => void;
}

const LOCALE_FIELDS = [
  { key: 'en', label: 'EN' },
  { key: 'he', label: 'HE' },
  { key: 'ar', label: 'AR' },
  { key: 'th', label: 'TH' },
] as const;

export function LocaleTranslationsAccordion({
  label = 'Translations',
  value,
  onChange,
}: LocaleTranslationsAccordionProps) {
  const handleChange = (key: keyof LocaleTranslations, nextValue: string) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  };

  return (
    <details className="rounded-md border border-border bg-muted/30">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-foreground">
        {label}
      </summary>
      <div className="grid gap-3 px-3 pb-3">
        {LOCALE_FIELDS.map((field) => (
          <div key={field.key} className="grid gap-1.5">
            <Label htmlFor={`locale-${field.key}`}>{field.label}</Label>
            <Input
              id={`locale-${field.key}`}
              value={value[field.key] ?? ''}
              onChange={(event) =>
                handleChange(field.key, event.target.value)
              }
              placeholder={field.label}
            />
          </div>
        ))}
      </div>
    </details>
  );
}
