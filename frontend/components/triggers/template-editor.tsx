'use client';

import { useRef } from 'react';
import { Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { TEMPLATE_VARIABLES, type NotificationTemplate } from '@/schemas/trigger.schema';

interface TemplateEditorProps {
    emailTemplate?: NotificationTemplate;
    smsTemplate?: NotificationTemplate;
    showEmail: boolean;
    showSms: boolean;
    onEmailChange: (template: NotificationTemplate) => void;
    onSmsChange: (template: NotificationTemplate) => void;
}

export function TemplateEditor({
    emailTemplate = { subject: '', body: '' },
    smsTemplate = { body: '' },
    showEmail,
    showSms,
    onEmailChange,
    onSmsChange,
}: TemplateEditorProps) {
    const emailSubjectRef = useRef<HTMLInputElement>(null);
    const emailBodyRef = useRef<HTMLTextAreaElement>(null);
    const smsBodyRef = useRef<HTMLTextAreaElement>(null);

    const insertVariable = (
        ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
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
                            emailTemplate.body, 
                            (body) => onEmailChange({ ...emailTemplate, body })
                        )} 
                    />
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                            ref={emailSubjectRef}
                            value={emailTemplate.subject || ''}
                            onChange={(e) => onEmailChange({ ...emailTemplate, subject: e.target.value })}
                            placeholder="e.g., Alert: {trigger_name} - {severity}"
                            className="font-mono text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Body</Label>
                        <Textarea
                            ref={emailBodyRef}
                            value={emailTemplate.body}
                            onChange={(e) => onEmailChange({ ...emailTemplate, body: e.target.value })}
                            placeholder="Enter your email message template..."
                            rows={4}
                            className="font-mono text-sm resize-none"
                        />
                    </div>
                    <EmailPreview template={emailTemplate} />
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
                            smsTemplate.body, 
                            (body) => onSmsChange({ ...smsTemplate, body })
                        )} 
                    />
                    <div className="space-y-2">
                        <Label>
                            Message <span className="text-muted-foreground font-normal">(max 160 characters recommended)</span>
                        </Label>
                        <Textarea
                            ref={smsBodyRef}
                            value={smsTemplate.body}
                            onChange={(e) => onSmsChange({ ...smsTemplate, body: e.target.value })}
                            placeholder="e.g., Alert: {trigger_name} at {site_name}. {metric}: {value}{unit}"
                            rows={3}
                            className="font-mono text-sm resize-none"
                        />
                        <p className={`text-xs ${smsTemplate.body.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                            {smsTemplate.body.length}/160 characters
                        </p>
                    </div>
                    <SmsPreview template={smsTemplate} />
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
                                emailTemplate.body, 
                                (body) => onEmailChange({ ...emailTemplate, body })
                            )} 
                        />
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input
                                ref={emailSubjectRef}
                                value={emailTemplate.subject || ''}
                                onChange={(e) => onEmailChange({ ...emailTemplate, subject: e.target.value })}
                                placeholder="e.g., Alert: {trigger_name} - {severity}"
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Body</Label>
                            <Textarea
                                ref={emailBodyRef}
                                value={emailTemplate.body}
                                onChange={(e) => onEmailChange({ ...emailTemplate, body: e.target.value })}
                                placeholder="Enter your email message template..."
                                rows={4}
                                className="font-mono text-sm resize-none"
                            />
                        </div>
                        <EmailPreview template={emailTemplate} />
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
                                smsTemplate.body, 
                                (body) => onSmsChange({ ...smsTemplate, body })
                            )} 
                        />
                        <div className="space-y-2">
                            <Label>
                                Message <span className="text-muted-foreground font-normal">(max 160 characters recommended)</span>
                            </Label>
                            <Textarea
                                ref={smsBodyRef}
                                value={smsTemplate.body}
                                onChange={(e) => onSmsChange({ ...smsTemplate, body: e.target.value })}
                                placeholder="e.g., Alert: {trigger_name} at {site_name}. {metric}: {value}{unit}"
                                rows={3}
                                className="font-mono text-sm resize-none"
                            />
                            <p className={`text-xs ${smsTemplate.body.length > 160 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                                {smsTemplate.body.length}/160 characters
                            </p>
                        </div>
                        <SmsPreview template={smsTemplate} />
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

function EmailPreview({ template }: { template: NotificationTemplate }) {
    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground">Preview</Label>
            <div className="rounded-lg p-4 border bg-background">
                {template.subject && (
                    <div className="mb-3 pb-3 border-b">
                        <span className="text-xs text-muted-foreground">Subject: </span>
                        <span className="font-medium">{replaceVariables(template.subject)}</span>
                    </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                    {template.body ? replaceVariables(template.body) : (
                        <span className="text-muted-foreground">No content</span>
                    )}
                </div>
            </div>
        </div>
    );
}

function SmsPreview({ template }: { template: NotificationTemplate }) {
    return (
        <div className="space-y-2">
            <Label className="text-muted-foreground">Preview</Label>
            <div className="rounded-lg p-4 border bg-background text-sm">
                {template.body ? replaceVariables(template.body) : (
                    <span className="text-muted-foreground">No content</span>
                )}
            </div>
        </div>
    );
}
