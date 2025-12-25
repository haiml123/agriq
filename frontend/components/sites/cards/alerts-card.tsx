import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Alert } from '../types';

interface AlertsCardProps {
  alerts: Alert[];
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  const t = useTranslations('sites');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('activeAlerts')}</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noDataAvailable')}</p>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border-b border-border pb-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{alert.title || alert.description}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {alert.thresholdValue && alert.unit
                        ? `${t('temperatureLabel').split(' ')[0]} ${alert.thresholdValue}${alert.unit}`
                        : alert.description}
                    </p>
                  </div>
                  <Badge
                    variant={alert.status === 'OPEN' ? 'default' : 'secondary'}
                    className={
                      alert.status === 'OPEN' ? 'bg-blue-600 hover:bg-blue-700' : ''
                    }
                  >
                    {tStatus(alert.status)}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className="mt-2 border-red-500 text-red-500"
                >
                  {tSeverity(alert.severity)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
