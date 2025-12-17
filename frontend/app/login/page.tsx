"use client"

import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/theme/ThemeToggle';
import Image from 'next/image';
import LogoBlack from '@/public/logo-black.png';
import LogoWhite from '@/public/logo-white.png';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                <div className="text-center flex flex-col mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Image
                            src={LogoBlack}
                            alt="AgriQ logo"
                            className="block h-16 w-auto dark:hidden"
                            priority
                        />
                        <Image
                            src={LogoWhite}
                            alt="AgriQ logo"
                            className="hidden h-16 w-auto dark:block"
                            priority
                        />
                    </div>
                    <p className="text-text-secondary">
                        Grain Storage Management Platform
                    </p>
                </div>

                <div className="bg-card border border-border rounded-lg shadow-sm p-8">
                    <LoginForm />
                    <p className="text-center text-sm text-text-secondary mt-6">
                        Quality protection, loss reduction, action at the right time.
                    </p>
                </div>
            </div>
        </div>
    );
}