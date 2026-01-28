import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { DashboardAlert } from '@/schemas/alert.schema';
import { SeverityEnum, AlertStatusEnum } from '../types';

const severityStyles = {
  [SeverityEnum.LOW]: 'bg-emerald-500 text-white border-transparent',
  [SeverityEnum.MEDIUM]: 'bg-yellow-500 text-white border-transparent',
  [SeverityEnum.HIGH]: 'bg-orange-500 text-white border-transparent',
  [SeverityEnum.CRITICAL]: 'bg-red-500 text-white border-transparent',
};

const statusStyles = {
  [AlertStatusEnum.OPEN]: 'bg-red-500/10 text-red-500 border-red-500/30',
  [AlertStatusEnum.IN_PROGRESS]: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  [AlertStatusEnum.ACKNOWLEDGED]: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  [AlertStatusEnum.RESOLVED]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  [AlertStatusEnum.DISMISSED]: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

interface ActiveAlertsSectionProps {
  alerts: DashboardAlert[];
  isLoading: boolean;
}

export function ActiveAlertsSection({ alerts, isLoading }: ActiveAlertsSectionProps) {
  const t = useTranslations();

  return (
    <section className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-6 pb-4">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          {t('dashboard.activeAlerts.title')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('dashboard.activeAlerts.description')}
        </p>
      </div>

      <div className="px-6 pb-6 space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            {t('dashboard.activeAlerts.loading')}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('dashboard.activeAlerts.noAlerts')}
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <Badge className={severityStyles[alert.severity]}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 mr-1" />
                  {t(`severity.${alert.severity}`)}
                </Badge>
                <span className="font-medium text-foreground">{alert.description}</span>
                <span className="text-sm text-muted-foreground">
                  {t('dashboard.activeAlerts.daysAgo', { count: alert.daysAgo })}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-2">{alert.location}</p>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className={statusStyles[alert.status]}>
                  {t(`alertStatus.${alert.status}`)}
                </Badge>
                {alert.assignee && (
                  <span className="text-sm text-muted-foreground">
                    {t('dashboard.activeAlerts.assignedTo', { name: alert.assignee })}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
