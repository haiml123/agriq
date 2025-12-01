'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Globe } from 'lucide-react';

interface Language {
    code: string;
    name: string;
    nativeName: string;
    isDefault: boolean;
    isEnabled: boolean;
}

const availableLanguages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', isDefault: true, isEnabled: true },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', isDefault: false, isEnabled: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', isDefault: false, isEnabled: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', isDefault: false, isEnabled: false },
    { code: 'fr', name: 'French', nativeName: 'Français', isDefault: false, isEnabled: false },
];

export default function LanguagesPage() {
    const [languages, setLanguages] = useState<Language[]>(availableLanguages);

    const toggleLanguage = (code: string) => {
        setLanguages(languages.map(lang => 
            lang.code === code ? { ...lang, isEnabled: !lang.isEnabled } : lang
        ));
    };

    const setDefaultLanguage = (code: string) => {
        setLanguages(languages.map(lang => ({
            ...lang,
            isDefault: lang.code === code,
            isEnabled: lang.code === code ? true : lang.isEnabled,
        })));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Languages</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Configure available languages for the platform
                </p>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground">Available Languages</h2>
                    <p className="text-sm text-muted-foreground">
                        Enable languages users can choose from
                    </p>
                </div>

                <div className="divide-y divide-border">
                    {languages.map((lang) => (
                        <div
                            key={lang.code}
                            className="p-4 hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-foreground">{lang.name}</h3>
                                            <span className="text-muted-foreground">({lang.nativeName})</span>
                                            {lang.isDefault && (
                                                <Badge className="bg-primary/10 text-primary border-primary/30">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Language code: {lang.code.toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!lang.isDefault && lang.isEnabled && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDefaultLanguage(lang.code)}
                                        >
                                            Set as default
                                        </Button>
                                    )}
                                    <Button
                                        variant={lang.isEnabled ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => toggleLanguage(lang.code)}
                                        disabled={lang.isDefault}
                                    >
                                        {lang.isEnabled ? (
                                            <>
                                                <Check className="w-4 h-4 mr-1" />
                                                Enabled
                                            </>
                                        ) : (
                                            'Enable'
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
