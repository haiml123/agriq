import { SeverityEnum, AlertStatusEnum } from '../types';

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case SeverityEnum.CRITICAL:
      return 'bg-red-500 hover:bg-red-600';
    case SeverityEnum.HIGH:
      return 'bg-orange-500 hover:bg-orange-600';
    case SeverityEnum.MEDIUM:
      return 'bg-yellow-500 hover:bg-yellow-600';
    case SeverityEnum.LOW:
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case AlertStatusEnum.OPEN:
      return 'bg-orange-500 hover:bg-orange-600';
    case AlertStatusEnum.ACKNOWLEDGED:
      return 'bg-blue-500 hover:bg-blue-600';
    case AlertStatusEnum.IN_PROGRESS:
      return 'bg-purple-500 hover:bg-purple-600';
    case AlertStatusEnum.RESOLVED:
      return 'bg-green-500 hover:bg-green-600';
    case AlertStatusEnum.DISMISSED:
      return 'bg-gray-500 hover:bg-gray-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
}

export function getTimeFilterDate(timeFilter: string): string | null {
  if (timeFilter === 'all') return null;

  const now = new Date();
  let startDate: Date;

  switch (timeFilter) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return null;
  }

  return startDate.toISOString();
}
