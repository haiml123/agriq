'use client';

import { useMemo, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { TEMPLATE_VARIABLES, type NotificationTemplate } from '@/schemas/trigger.schema';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';

interface TemplateEditorProps {
    emailTemplate?: NotificationTemplate;
    smsTemplate?: NotificationTemplate;
    showEmail: boolean;
    showSms: boolean;
    onEmailChange: (template: NotificationTemplate) => void;
    onSmsChange: (template: NotificationTemplate) => void;
}

export function TemplateEditor({
    emailTemplate = { subject: { en: '' }, body: { en: '' } },
    smsTemplate = { body: { en: '' } },
    showEmail,
    showSms,
    onEmailChange,
    onSmsChange,
}: TemplateEditorProps) {
    const emailSubjectRef = useRef<HTMLInputElement>(null);
    const emailBodyRef = useRef<HTMLTextAreaElement>(null);
    const smsBodyRef = useRef<HTMLTextAreaElement>(null);
    const currentLocale = useLocale();
    const availableLocales = routing.locales;
    const defaultLocale = availableLocales.includes(currentLocale) ? currentLocale : 'en';
    const [activeLocale, setActiveLocale] = useState<string>(defaultLocale);

    const emailSubjectValue = useMemo(
        () => emailTemplate.subject?.[activeLocale] ?? '',
        [emailTemplate.subject, activeLocale],
    );
    const emailBodyValue = useMemo(
        () => emailTemplate.body?.[activeLocale] ?? '',
        [emailTemplate.body, activeLocale],
    );
    const smsBodyValue = useMemo(
        () => smsTemplate.body?.[activeLocale] ?? '',
        [smsTemplate.body, activeLocale],
    );

    const setLocaleValue = (
        map: Record<string, string> | undefined,
        locale: string,
        value: string,
    ) => ({
        ...(map ?? {}),
        [locale]: value,
    });

    const insertVariable = (
        ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
        variable: string,
        currentValue: string,
        onUpdate: (value: string) => void
    ) => {
        if (ref.current) {
            const start = ref.current.selectionStart || 0;
            const end = ref.current.selectionEnd || 0;
            const newValue = currentValue.slice(0, start) + variable + currentValue.slice(end);
            onUpdate(newValue);

            setTimeout(() => {
                ref.current?.focus();
                ref.current?.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    // Determine default tab
    const defaultTab = showEmail ? 'email' : 'sms';

    // If only email template
    if (showEmail && !showSms) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="text-sm font-semibold">Email Template</h4>
                    <VariableChips 
                        onInsert={(v) => insertVariable(
                            emailBodyRef, 
                            v, 
                            emailBodyValue, 
                            (body) => onEmailChange({ ...emailTemplate, body: setLocaleValue(emailTemplate.body, activeLocale, body) })
                        )} 
                    />
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <Label>Subject</Label>
                            <LanguageToggle value={activeLocale} onChange={setActiveLocale} />
                        </div>
                        <Input
                            ref={emailSubjectRef}
                            value={emailSubjectValue}
                            onChange={(e) =>
                                onEmailChange({
                                    ...emailTemplate,
                                    subject: setLocaleValue(emailTemplate.subject, activeLocale, e.target.value),
                                })
                            }
                            placeholder="e.g., Alert: {trigger_name} - {severity}"
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea
                            ref={emailBodyRef}
                            value={emailBodyValue}
                            onChange={(e) =>
                                onEmailChange({
                                    ...emailTemplate,
                                    body: setLocaleValue(emailTemplate.body, activeLocale, e.target.value),
                                })
                            }
                            placeholder="Enter your email message template..."
                            rows={4}
                            className="font-mono text-sm resize-none"
                        />
                    </div>
                    <EmailPreview template={emailTemplate} locale={activeLocale} />
                </CardContent>
            </Card>
        );
    }

    // If only SMS template
    if (!showEmail && showSms) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h4 className="text-sm font-semibold">SMS Template</h4>
                    <VariableChips 
                        onInsert={(v) => insertVariable(
                            smsBodyRef, 
                            v, 
                            smsBodyValue, 
                            (body) => onSmsChange({ ...smsTemplate, body: setLocaleValue(smsTemplate.body, activeLocale, body) })
                        )} 
                    />
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <Label>
                                Message <span className="text-muted-foreground font-normal">(max 160 characters recommended)</span>
                            </Label>
                            <LanguageToggle value={activeLocale} onChange={setActiveLocale} />
                        </div>
                        <Textarea
                            ref={smsBodyRef}
                            value={smsBodyValue}
                            onChange={(e) =>
                                onSmsChange({
                                    ...smsTemplate,
                                    body: setLocaleValue(smsTemplate.body, activeLocale, e.target.value),
                                })
                            }
                            placeholder="e.g., Alert: {trigger_name} at {site_name}. {metric}: {value}{unit}"
                            rows={3}
                            className="font-mono text-sm resize-none"
                        />
                        <p className={`text-xs ${smsBodyValue.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {smsBodyValue.length}/160 characters
                        </p>
                    </div>
                    <SmsPreview template={smsTemplate} locale={activeLocale} />
                </CardContent>
            </Card>
        );
    }

    // Both templates
    return (
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[200px]">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="sms">SMS</TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="mt-4">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <VariableChips 
                            onInsert={(v) => insertVariable(
                                emailBodyRef, 
                                v, 
                                emailBodyValue, 
                                (body) => onEmailChange({ ...emailTemplate, body: setLocaleValue(emailTemplate.body, activeLocale, body) })
                            )} 
                        />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label>Subject</Label>
                                <LanguageToggle value={activeLocale} onChange={setActiveLocale} />
                            </div>
                            <Input
                                ref={emailSubjectRef}
                                value={emailSubjectValue}
                                onChange={(e) =>
                                    onEmailChange({
                                        ...emailTemplate,
                                        subject: setLocaleValue(emailTemplate.subject, activeLocale, e.target.value),
                                    })
                                }
                                placeholder="e.g., Alert: {trigger_name} - {severity}"
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Body</Label>
                            <Textarea
                                ref={emailBodyRef}
                                value={emailBodyValue}
                                onChange={(e) =>
                                    onEmailChange({
                                        ...emailTemplate,
                                        body: setLocaleValue(emailTemplate.body, activeLocale, e.target.value),
                                    })
                                }
                                placeholder="Enter your email message template..."
                                rows={4}
                                className="font-mono text-sm resize-none"
                            />
                        </div>
                        <EmailPreview template={emailTemplate} locale={activeLocale} />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="sms" className="mt-4">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <VariableChips 
                            onInsert={(v) => insertVariable(
                                smsBodyRef, 
                                v, 
                                smsBodyValue, 
                                (body) => onSmsChange({ ...smsTemplate, body: setLocaleValue(smsTemplate.body, activeLocale, body) })
                            )} 
                        />
                        <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label>
                                    Message <span className="text-muted-foreground font-normal">(max 160 characters recommended)</span>
                                </Label>
                                <LanguageToggle value={activeLocale} onChange={setActiveLocale} />
                            </div>
                            <Textarea
                                ref={smsBodyRef}
                                value={smsBodyValue}
                                onChange={(e) =>
                                    onSmsChange({
                                        ...smsTemplate,
                                        body: setLocaleValue(smsTemplate.body, activeLocale, e.target.value),
                                    })
                                }
                                placeholder="e.g., Alert: {trigger_name} at {site_name}. {metric}: {value}{unit}"
                                rows={3}
                                className="font-mono text-sm resize-none"
                            />
                            <p className={`text-xs ${smsBodyValue.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                {smsBodyValue.length}/160 characters
                            </p>
                        </div>
                        <SmsPreview template={smsTemplate} locale={activeLocale} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

function VariableChips({ onInsert }: { onInsert: (variable: string) => void }) {
    return (
        <div className="rounded-lg p-3 border bg-muted/50">
            <div className="flex items-center gap-1.5 mb-2">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Available Variables (click to insert)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                    <button
                        key={v.key}
                        type="button"
                        onClick={() => onInsert(v.key)}
                        title={v.description}
                        className="px-2 py-1 text-xs rounded font-mono transition-colors bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                    >
                        {v.key}
                    </button>
                ))}
            </div>
        </div>
    );
}

function replaceVariables(text: string): string {
    return text
        .replace(/{trigger_name}/g, 'High Temperature Alert')
        .replace(/{site_name}/g, 'Main Warehouse')
        .replace(/{compound_name}/g, 'Building A')
        .replace(/{cell_name}/g, 'Storage Unit 1')
        .replace(/{sensor_name}/g, 'Sensor #1')
        .replace(/{metric}/g, 'Temperature')
        .replace(/{value}/g, '32.5')
        .replace(/{unit}/g, '°C')
        .replace(/{threshold}/g, '30')
        .replace(/{severity}/g, 'HIGH')
        .replace(/{timestamp}/g, new Date().toLocaleString());
}

function EmailPreview({ template, locale }: { template: NotificationTemplate; locale: string }) {
    const subject = template.subject?.[locale] ?? '';
    const body = template.body?.[locale] ?? '';
    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground">Preview</Label>
            <div className="rounded-lg p-4 border bg-background">
                {subject && (
                    <div className="mb-3 pb-3 border-b">
                        <span className="text-xs text-muted-foreground">Subject: </span>
                        <span className="font-medium">{replaceVariables(subject)}</span>
                    </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {body ? replaceVariables(body) : (
                        <span className="text-muted-foreground">No content</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function SmsPreview({ template, locale }: { template: NotificationTemplate; locale: string }) {
    const body = template.body?.[locale] ?? '';
    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground">Preview</Label>
            <div className="rounded-lg p-4 border bg-background text-sm">
                {body ? replaceVariables(body) : (
                    <span className="text-muted-foreground">No content</span>
                )}
            </div>
        </div>
    );
}

function LanguageToggle({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    return (
        <div className="flex items-center gap-1 rounded-lg p-1 bg-muted">
            {routing.locales.map((locale) => (
                <button
                    key={locale}
                    type="button"
                    onClick={() => onChange(locale)}
                    className={`px-2 py-1 text-xs font-medium uppercase rounded-md transition-colors ${
                        value === locale
                            ? 'bg-background text-emerald-600 shadow-sm dark:text-emerald-400'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {locale}
                </button>
            ))}
        </div>
    );
}
