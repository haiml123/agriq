import './globals.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { getLocale } from 'next-intl/server';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();

    return (
        <html lang={locale} dir={locale === 'he' ? 'rtl' : 'ltr'} suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} bg-background antialiased`}>
        {children}
        </body>
        </html>
    );
}
