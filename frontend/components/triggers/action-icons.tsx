import { Bell, Mail, Smartphone, Webhook } from 'lucide-react';
import type { Action } from '@/schemas/trigger.schema';

interface ActionIconsProps {
    actions: Action[];
}

export function ActionIcons({ actions }: ActionIconsProps) {
    const hasAction = (type: string) => actions.some((a) => a.type === type);

    return (
        <div className="flex gap-1">
            {hasAction('EMAIL') && (
                <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded" title="Email">
                    <Mail className="w-4 h-4" />
                </span>
            )}
            {hasAction('SMS') && (
                <span className="p-1.5 bg-purple-500/10 text-purple-500 rounded" title="SMS">
                    <Smartphone className="w-4 h-4" />
                </span>
            )}
            {hasAction('PUSH') && (
                <span className="p-1.5 bg-pink-500/10 text-pink-500 rounded" title="Push Notification">
                    <Bell className="w-4 h-4" />
                </span>
            )}
            {hasAction('WEBHOOK') && (
                <span className="p-1.5 bg-orange-500/10 text-orange-500 rounded" title="Webhook">
                    <Webhook className="w-4 h-4" />
                </span>
            )}
        </div>
    );
}
