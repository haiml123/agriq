"use client"

import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/theme/ThemeToggle';

export default function LoginPage() {
    console.log("login page");
    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        AgriQ
                    </h1>
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