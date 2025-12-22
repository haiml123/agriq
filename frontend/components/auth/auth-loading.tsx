'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function AuthLoading() {
  const t = useTranslations('auth');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-ping" />
          <div className="relative w-32 h-32 flex items-center justify-center animate-pulse">
            {/* Light theme logo - hidden in dark mode */}
            <Image
              src="/logo-black.png"
              alt="Logo"
              width={128}
              height={128}
              className="object-contain dark:hidden"
              priority
            />
            {/* Dark theme logo - hidden in light mode */}
            <Image
              src="/logo-white.png"
              alt="Logo"
              width={128}
              height={128}
              className="object-contain hidden dark:block"
              priority
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            {t('loading.title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('loading.subtitle')}
          </p>
        </div>

        {/* Loading dots animation */}
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
