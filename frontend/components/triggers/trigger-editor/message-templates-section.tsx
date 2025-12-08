import { type Action, type ActionType, getActionByType, hasActionType } from '@/schemas/trigger.schema';
import { CommunicationTypeEnum } from '@/schemas/common.schema';
import { TemplateEditor } from '@/components/triggers';

interface MessageTemplatesSectionProps {
    actions: Action[];
    onUpdateTemplate: (actionType: ActionType, template: Action['template']) => void;
}

export function MessageTemplatesSection({ actions, onUpdateTemplate }: MessageTemplatesSectionProps) {
    const showEmail = hasActionType(actions, 'EMAIL');
    const showSms = hasActionType(actions, 'SMS');

    if (!showEmail && !showSms) {
        return null;
    }

    const emailTemplate = getActionByType(actions, 'EMAIL')?.template || { subject: '', body: '' };
    const smsTemplate = getActionByType(actions, 'SMS')?.template || { body: '' };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Message Templates
            </h3>
            <TemplateEditor
                emailTemplate={emailTemplate}
                smsTemplate={smsTemplate}
                showEmail={showEmail}
                showSms={showSms}
                onEmailChange={(template) => onUpdateTemplate(CommunicationTypeEnum.EMAIL, template)}
                onSmsChange={(template) => onUpdateTemplate(CommunicationTypeEnum.SMS, template)}
            />
        </div>
    );
}
