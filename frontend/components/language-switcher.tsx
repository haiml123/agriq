'use client';

import type { ChangeEvent } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

const localeOptions = [
    { value: 'en', label: 'English' },
    { value: 'he', label: 'עברית' },
    { value: 'es', label: 'Español' },
] as const;

export function LanguageSwitcher() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = event.target.value as (typeof localeOptions)[number]['value'];
        const queryString = searchParams.toString();
        const nextPath = queryString ? `${pathname}?${queryString}` : pathname;

        router.replace(nextPath, { locale: nextLocale });
    };

    return (
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <span className="sr-only">Language</span>
            <select
                value={locale}
                onChange={handleChange}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                aria-label="Select language"
            >
                {localeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
