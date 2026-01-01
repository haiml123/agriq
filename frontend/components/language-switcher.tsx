'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

export function LanguageSwitcher() {
    const t = useTranslations('language');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const switchLocale = (newLocale: Locale) => {
        startTransition(() => {
            router.replace(pathname, { locale: newLocale });
        });
    };

    const languageLabels: Record<Locale, string> = {
        en: t('english'),
        he: t('hebrew'),
        ar: t('arabic'),
        th: t('thai'),
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    aria-label={t('label')}
                    title={t('label')}
                >
                    <Globe className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {routing.locales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => switchLocale(loc)}
                        className={locale === loc ? 'bg-accent' : ''}
                    >
                        {languageLabels[loc]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
