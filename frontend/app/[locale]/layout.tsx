import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ModalProvider } from '@/components/providers/modal-provider';
import { SessionProvider } from '@/components/providers/session-provider';

export const metadata: Metadata = {
    title: 'AgriQ - Grain Storage Management',
    description: 'Quality protection, loss reduction, action at the right time',
    icons: {
        icon: '/favicon.ico',
    },
};

export default async function LocaleLayout({
                                                children,
                                                params,
                                            }: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {
    setRequestLocale(params.locale);
    const messages = await getMessages();

    return (
        <SessionProvider>
            <ThemeProvider>
                <NextIntlClientProvider messages={messages} locale={params.locale}>
                    <ModalProvider>{children}</ModalProvider>
                </NextIntlClientProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
