import { cn } from '@/lib/utils';
import type { MissionStatus, CampaignStatus, SyncStatus } from '@/lib/types';

type StatusType = MissionStatus | CampaignStatus | SyncStatus | 'available' | 'occupied' | 'maintenance';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  // Mission statuses
  pending: { label: 'En attente', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  in_progress: { label: 'En cours', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Terminée', className: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Annulée', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  
  // Campaign statuses
  draft: { label: 'Brouillon', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  active: { label: 'Active', className: 'bg-primary/10 text-primary border-primary/20' },
  paused: { label: 'En pause', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  
  // Panel statuses
  available: { label: 'Disponible', className: 'bg-green-50 text-green-700 border-green-200' },
  occupied: { label: 'Occupé', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  maintenance: { label: 'Maintenance', className: 'bg-red-50 text-red-700 border-red-200' },
  
  // Sync statuses
  online: { label: 'En ligne', className: 'bg-green-50 text-green-700 border-green-200' },
  offline: { label: 'Hors ligne', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  syncing: { label: 'Synchronisation', className: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
