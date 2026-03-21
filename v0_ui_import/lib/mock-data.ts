import type { User, Zone, Panel, Campaign, Mission, Report } from './types';

export const mockUser: User = {
  id: 'user-1',
  name: 'Marie Dupont',
  email: 'marie.dupont@billboardeye.fr',
  role: 'agent',
  avatar: undefined,
};

export const mockManager: User = {
  id: 'user-2',
  name: 'Jean Martin',
  email: 'jean.martin@billboardeye.fr',
  role: 'manager',
  avatar: undefined,
};

export const mockZones: Zone[] = [
  { id: 'zone-1', name: 'Centre-Ville', city: 'Paris', panelCount: 45 },
  { id: 'zone-2', name: 'La Défense', city: 'Paris', panelCount: 32 },
  { id: 'zone-3', name: 'Bellecour', city: 'Lyon', panelCount: 28 },
  { id: 'zone-4', name: 'Vieux-Port', city: 'Marseille', panelCount: 38 },
  { id: 'zone-5', name: 'Place du Capitole', city: 'Toulouse', panelCount: 22 },
];

export const mockPanels: Panel[] = [
  {
    id: 'panel-1',
    code: 'PAR-CV-001',
    address: '12 Rue de Rivoli, 75001 Paris',
    zone: mockZones[0],
    type: '4x3',
    status: 'occupied',
    lastSync: '2026-03-21T10:30:00Z',
    photos: [
      { id: 'photo-1', url: '/placeholder.svg', face: 'A', takenAt: '2026-03-21T10:30:00Z', synced: true },
    ],
  },
  {
    id: 'panel-2',
    code: 'PAR-CV-002',
    address: '45 Avenue des Champs-Élysées, 75008 Paris',
    zone: mockZones[0],
    type: '8x3',
    status: 'occupied',
    lastSync: '2026-03-21T09:15:00Z',
    photos: [],
  },
  {
    id: 'panel-3',
    code: 'PAR-CV-003',
    address: '8 Place de la Concorde, 75001 Paris',
    zone: mockZones[0],
    type: '12x4',
    status: 'available',
    lastSync: '2026-03-20T16:45:00Z',
    photos: [],
  },
  {
    id: 'panel-4',
    code: 'PAR-LD-001',
    address: 'Parvis de La Défense, 92800 Puteaux',
    zone: mockZones[1],
    type: '4x3',
    status: 'maintenance',
    lastSync: undefined,
    photos: [],
  },
  {
    id: 'panel-5',
    code: 'LYO-BC-001',
    address: 'Place Bellecour, 69002 Lyon',
    zone: mockZones[2],
    type: 'abris',
    status: 'occupied',
    lastSync: '2026-03-21T08:00:00Z',
    photos: [
      { id: 'photo-2', url: '/placeholder.svg', face: 'A', takenAt: '2026-03-21T08:00:00Z', synced: true },
      { id: 'photo-3', url: '/placeholder.svg', face: 'B', takenAt: '2026-03-21T08:02:00Z', synced: false },
    ],
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Lancement Parfum Étoile',
    client: 'Maison Étoile',
    startDate: '2026-03-01',
    endDate: '2026-04-15',
    status: 'active',
    panelCount: 120,
    completedPanels: 87,
    zones: [mockZones[0], mockZones[1], mockZones[2]],
    coverageRate: 72.5,
  },
  {
    id: 'camp-2',
    name: 'Soldes Printemps Mode',
    client: 'Galeries Mode',
    startDate: '2026-03-15',
    endDate: '2026-04-30',
    status: 'active',
    panelCount: 85,
    completedPanels: 34,
    zones: [mockZones[0], mockZones[3]],
    coverageRate: 40,
  },
  {
    id: 'camp-3',
    name: 'Festival Jazz 2026',
    client: 'Jazz Productions',
    startDate: '2026-05-01',
    endDate: '2026-06-15',
    status: 'draft',
    panelCount: 60,
    completedPanels: 0,
    zones: [mockZones[2], mockZones[4]],
    coverageRate: 0,
  },
  {
    id: 'camp-4',
    name: 'Ouverture Restaurant Le Gourmet',
    client: 'Le Gourmet SAS',
    startDate: '2026-02-01',
    endDate: '2026-03-01',
    status: 'completed',
    panelCount: 25,
    completedPanels: 25,
    zones: [mockZones[0]],
    coverageRate: 100,
  },
];

export const mockMissions: Mission[] = [
  {
    id: 'mission-1',
    campaign: mockCampaigns[0],
    agent: mockUser,
    zone: mockZones[0],
    panels: mockPanels.filter((p) => p.zone.id === 'zone-1'),
    status: 'in_progress',
    completedPanels: 2,
    assignedAt: '2026-03-20T08:00:00Z',
  },
  {
    id: 'mission-2',
    campaign: mockCampaigns[0],
    agent: mockUser,
    zone: mockZones[1],
    panels: mockPanels.filter((p) => p.zone.id === 'zone-2'),
    status: 'pending',
    completedPanels: 0,
    assignedAt: '2026-03-21T08:00:00Z',
  },
  {
    id: 'mission-3',
    campaign: mockCampaigns[1],
    agent: mockUser,
    zone: mockZones[0],
    panels: mockPanels.filter((p) => p.zone.id === 'zone-1'),
    status: 'completed',
    completedPanels: 3,
    assignedAt: '2026-03-18T08:00:00Z',
    completedAt: '2026-03-18T17:30:00Z',
  },
];

export const mockReport: Report = {
  id: 'report-1',
  campaign: mockCampaigns[0],
  createdAt: '2026-03-21T12:00:00Z',
  coverageRate: 72.5,
  summary: 'La campagne Lancement Parfum Étoile progresse conformément au planning. 87 panneaux sur 120 ont été vérifiés et photographiés. Le taux de couverture atteint 72.5%.',
  zones: [
    {
      zone: mockZones[0],
      panelCount: 45,
      completedCount: 38,
      photos: mockPanels[0].photos || [],
    },
    {
      zone: mockZones[1],
      panelCount: 32,
      completedCount: 25,
      photos: [],
    },
    {
      zone: mockZones[2],
      panelCount: 28,
      completedCount: 24,
      photos: mockPanels[4].photos || [],
    },
  ],
  legends: [
    'Photo prise de jour uniquement',
    'Angle de prise de vue : face, perpendiculaire',
    'Visuel vérifié conforme à la maquette fournie',
  ],
};

export const dashboardStats = {
  activeCampaigns: 2,
  totalPanels: 165,
  missionsToday: 5,
  coverageRate: 68.5,
  pendingSync: 12,
  completedMissions: 47,
};
