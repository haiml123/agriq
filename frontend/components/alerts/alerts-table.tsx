import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApp } from '@/providers/app-provider';
import type { ApiAlert } from './types';
import { getSeverityColor, getStatusColor } from './utils/alert-utils';
import { AlertStatusEnum } from './types';

interface AlertsTableProps {
  alerts: ApiAlert[];
  onAcknowledge: (alertId: string) => void;
}

export function AlertsTable({ alerts, onAcknowledge }: AlertsTableProps) {
  const t = useTranslations('pages.alerts');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');
  const { isRTL } = useApp();
  const tableAlignmentClass = isRTL ? 'text-right [&_th]:text-right [&_td]:text-right' : '';

  return (
    <Table className={tableAlignmentClass}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('severity')}</TableHead>
          <TableHead>{t('site')}</TableHead>
          <TableHead>{t('cell')}</TableHead>
          <TableHead>{t('description')}</TableHead>
          <TableHead>{t('trigger')}</TableHead>
          <TableHead>{t('created')}</TableHead>
          <TableHead>{t('status')}</TableHead>
          <TableHead>{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert.id}>
            <TableCell>
              <Badge className={getSeverityColor(alert.severity)}>
                {tSeverity(alert.severity)}
              </Badge>
            </TableCell>
            <TableCell>{alert.site?.name || '-'}</TableCell>
            <TableCell>{alert.cell?.name || '-'}</TableCell>
            <TableCell className="max-w-md">
              <div>
                {alert.title && <div className="font-medium">{alert.title}</div>}
                <div className="text-sm text-muted-foreground">{alert.description}</div>
              </div>
            </TableCell>
            <TableCell>{alert.commodity?.name || '-'}</TableCell>
            <TableCell>
              {format(new Date(alert.startedAt), 'dd/MM/yyyy HH:mm')}
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(alert.status)}>
                {tStatus(alert.status)}
              </Badge>
            </TableCell>
            <TableCell>
              {alert.status === AlertStatusEnum.OPEN ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  {t('acknowledge')}
                </Button>
              ) : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
