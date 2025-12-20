import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'he', 'es'],
    defaultLocale: 'en',
    localePrefix: 'always',
});
