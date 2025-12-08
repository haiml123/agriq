import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EntityStatus, EntityStatusEnum, Severity, SeverityEnum } from '@/schemas/common.schema';

interface StatusIndicatorProps {
  status: Severity;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  if (status === SeverityEnum.CRITICAL) {
    return (
      <div className="flex items-center gap-1.5 text-red-400">
        <AlertTriangle size={14} className="animate-pulse" />
        <span className="text-xs font-medium">Critical</span>
      </div>
    );
  }
  if (status === SeverityEnum.MEDIUM) {
    return (
      <div className="flex items-center gap-1.5 text-amber-400">
        <AlertTriangle size={14} />
        <span className="text-xs font-medium">Warning</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-emerald-400">
      <CheckCircle2 size={14} />
      <span className="text-xs font-medium">Healthy</span>
    </div>
  );
};

interface StatusDotProps {
  status: EntityStatus | undefined;
}

export const StatusDot: React.FC<StatusDotProps> = ({ status }) => {
  const styles: Record<string, string> = {
    [EntityStatusEnum.ACTIVE] : 'bg-emerald-500',
    [EntityStatusEnum.BLOCKED]: 'bg-amber-500',
    [EntityStatusEnum.DELETED]: 'bg-red-500 animate-pulse',
  };

  return <div className={`w-1.5 h-1.5 rounded-full ${status ? styles[status] : styles[EntityStatusEnum.ACTIVE]}`} />;
};
