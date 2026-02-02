import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ModalProvider } from '@/components/providers/modal-provider';
import { SessionProvider } from '@/components/providers/session-provider';
import { AppProvider } from '@/providers/app-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Toaster } from 'sonner';
import { auth } from '@/lib/auth';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export default async function LocaleLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;

    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();
    const session = await auth();

    // Hebrew and Arabic are RTL languages
    const isRTL = locale === 'he' || locale === 'ar';

    return (
        <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} bg-background antialiased`}>
                <NextIntlClientProvider messages={messages}>
                    <SessionProvider session={session}>
                        <AppProvider>
                            <ThemeProvider>
                                <ModalProvider>
                                    {children}
                                </ModalProvider>
                                <Toaster richColors position="top-right" />
                            </ThemeProvider>
                        </AppProvider>
                    </SessionProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
