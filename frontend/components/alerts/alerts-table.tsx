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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useApp } from '@/providers/app-provider';
import type { ApiAlert } from './types';
import { getSeverityColor, getStatusColor } from './utils/alert-utils';
import { AlertStatusEnum } from './types';

interface AlertsTableProps {
  alerts: ApiAlert[];
  onAcknowledge: (alertId: string) => void;
  onStatusChange: (alertId: string, newStatus: string) => void;
}

export function AlertsTable({ alerts, onAcknowledge, onStatusChange }: AlertsTableProps) {
  const t = useTranslations('pages.alerts');
  const tSeverity = useTranslations('severity');
  const tStatus = useTranslations('alertStatus');
  const { isRTL } = useApp();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={isRTL ? 'text-right' : ''}>{t('severity')}</TableHead>
          <TableHead className={isRTL ? 'text-right' : ''}>{t('site')}</TableHead>
          <TableHead className={isRTL ? 'text-right' : ''}>{t('cell')}</TableHead>
          <TableHead className={isRTL ? 'text-right' : ''}>{t('description')}</TableHead>
          <TableHead className={isRTL ? 'text-right' : ''}>{t('trigger')}</TableHead>
          <TableHead className={isRTL ? 'text-right' : ''}>{t('created')}</TableHead>
          <TableHead className={isRTL ? 'text-right' : ''}>{t('status')}</TableHead>
          <TableHead className="text-right">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow key={alert.id}>
            <TableCell className={isRTL ? 'text-right' : ''}>
              <Badge className={getSeverityColor(alert.severity)}>
                {tSeverity(alert.severity)}
              </Badge>
            </TableCell>
            <TableCell className={isRTL ? 'text-right' : ''}>{alert.site?.name || '-'}</TableCell>
            <TableCell className={isRTL ? 'text-right' : ''}>{alert.cell?.name || '-'}</TableCell>
            <TableCell className={isRTL ? 'text-right max-w-md' : 'max-w-md'}>
              <div>
                {alert.title && <div className="font-medium">{alert.title}</div>}
                <div className="text-sm text-muted-foreground">{alert.description}</div>
              </div>
            </TableCell>
            <TableCell className={isRTL ? 'text-right' : ''}>{alert.commodity?.name || '-'}</TableCell>
            <TableCell className={isRTL ? 'text-right' : ''}>
              {format(new Date(alert.startedAt), 'dd/MM/yyyy HH:mm')}
            </TableCell>
            <TableCell className={isRTL ? 'text-right' : ''}>
              <Badge className={getStatusColor(alert.status)}>
                {tStatus(alert.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {alert.status === AlertStatusEnum.OPEN && (
                    <>
                      <DropdownMenuItem onClick={() => onAcknowledge(alert.id)}>
                        {t('acknowledge')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(alert.id, AlertStatusEnum.IN_PROGRESS)}>
                        {t('startInvestigating')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(alert.id, AlertStatusEnum.DISMISSED)}>
                        {t('dismiss')}
                      </DropdownMenuItem>
                    </>
                  )}
                  {alert.status === AlertStatusEnum.ACKNOWLEDGED && (
                    <>
                      <DropdownMenuItem onClick={() => onStatusChange(alert.id, AlertStatusEnum.IN_PROGRESS)}>
                        {t('startInvestigating')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(alert.id, AlertStatusEnum.DISMISSED)}>
                        {t('dismiss')}
                      </DropdownMenuItem>
                    </>
                  )}
                  {alert.status === AlertStatusEnum.IN_PROGRESS && (
                    <>
                      <DropdownMenuItem onClick={() => onStatusChange(alert.id, AlertStatusEnum.RESOLVED)}>
                        {t('resolve')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(alert.id, AlertStatusEnum.DISMISSED)}>
                        {t('dismiss')}
                      </DropdownMenuItem>
                    </>
                  )}
                  {(alert.status === AlertStatusEnum.RESOLVED || alert.status === AlertStatusEnum.DISMISSED) && (
                    <DropdownMenuItem onClick={() => onStatusChange(alert.id, AlertStatusEnum.OPEN)}>
                      {t('reopenAlert')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
