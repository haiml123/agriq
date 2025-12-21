import type { Severity } from '@/schemas/common.schema';

const severityStyles: Record<Severity, string> = {
    LOW: 'bg-emerald-500 text-white',
    MEDIUM: 'bg-amber-500 text-white',
    HIGH: 'bg-orange-500 text-white',
    CRITICAL: 'bg-red-500 text-white',
};

interface SeverityBadgeProps {
    severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${severityStyles[severity]}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 mr-1" />
            {severity.charAt(0) + severity.slice(1).toLowerCase()}
        </span>
    );
}