'use client';

import type React from 'react';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { type Action, type ActionType, hasActionType } from '@/schemas/trigger.schema';
import { Checkbox } from '@/components/ui/checkbox';
import { CommunicationTypeEnum } from '@/schemas/common.schema';

interface NotificationActionsSectionProps {
    actions: Action[];
    onToggle: (actionType: ActionType) => void;
}

interface ActionConfig {
    type: ActionType;
    label: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
}

const ACTION_CONFIGS: ActionConfig[] = [
    { type: CommunicationTypeEnum.EMAIL, label: 'Email', description: 'Send email notification', Icon: Mail },
    { type: CommunicationTypeEnum.SMS, label: 'SMS', description: 'Send text message', Icon: Smartphone },
    { type: CommunicationTypeEnum.PUSH, label: 'Push', description: 'Push notification', Icon: Bell },
];

const ACTION_COLORS: Record<ActionType, { border: string; bg: string; icon: string }> = {
    EMAIL: {
        border: 'border-blue-500 bg-blue-500/10',
        bg: 'bg-blue-500 text-white',
        icon: 'bg-blue-500 text-white',
    },
    SMS: {
        border: 'border-purple-500 bg-purple-500/10',
        bg: 'bg-purple-500 text-white',
        icon: 'bg-purple-500 text-white',
    },
    PUSH: {
        border: 'border-pink-500 bg-pink-500/10',
        bg: 'bg-pink-500 text-white',
        icon: 'bg-pink-500 text-white',
    },
};

export function NotificationActionsSection({ actions, onToggle }: NotificationActionsSectionProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Notification Actions
            </h3>

            <div className="flex flex-wrap gap-3">
                {ACTION_CONFIGS.map((config) => (
                    <ActionCard
                        key={config.type}
                        config={config}
                        isActive={hasActionType(actions, config.type)}
                        onToggle={() => onToggle(config.type)}
                    />
                ))}
            </div>

            {actions.length === 0 && (
                <p className="text-sm text-destructive">
                    Please select at least one notification action.
                </p>
            )}
        </div>
    );
}

function ActionCard({
    config,
    isActive,
    onToggle,
}: {
    config: ActionConfig;
    isActive: boolean;
    onToggle: () => void;
}) {
    const { type, label, description, Icon } = config;
    const colors = ACTION_COLORS[type];

    const borderStyle = isActive
        ? colors.border
        : 'border-border hover:border-muted-foreground/30';

    const iconStyle = isActive
        ? colors.icon
        : 'bg-muted text-muted-foreground';

    return (
        <label
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${borderStyle}`}
        >
            <Checkbox checked={isActive} onCheckedChange={onToggle} />
            <div className={`p-2 rounded-lg ${iconStyle}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <div className="font-medium">{label}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
            </div>
        </label>
    );
}
