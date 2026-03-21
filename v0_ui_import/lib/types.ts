// Types pour BillboardEye

export type UserRole = 'agent' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type SyncStatus = 'online' | 'offline' | 'syncing';

export interface Zone {
  id: string;
  name: string;
  city: string;
  panelCount: number;
}

export interface Panel {
  id: string;
  code: string;
  address: string;
  zone: Zone;
  type: '4x3' | '8x3' | '12x4' | 'abris' | 'mobilier';
  status: 'available' | 'occupied' | 'maintenance';
  lastSync?: string;
  photos?: PanelPhoto[];
}

export interface PanelPhoto {
  id: string;
  url: string;
  face: 'A' | 'B';
  takenAt: string;
  synced: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  panelCount: number;
  completedPanels: number;
  zones: Zone[];
  coverageRate: number;
}

export interface Mission {
  id: string;
  campaign: Campaign;
  agent: User;
  zone: Zone;
  panels: Panel[];
  status: MissionStatus;
  completedPanels: number;
  assignedAt: string;
  completedAt?: string;
}

export interface Report {
  id: string;
  campaign: Campaign;
  createdAt: string;
  coverageRate: number;
  summary: string;
  zones: ZoneReport[];
  legends: string[];
}

export interface ZoneReport {
  zone: Zone;
  panelCount: number;
  completedCount: number;
  photos: PanelPhoto[];
}
