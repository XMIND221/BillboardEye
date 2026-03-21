'use client';

import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { dashboardStats, mockCampaigns, mockMissions } from '@/lib/mock-data';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  LayoutGrid,
  ClipboardList,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export function DashboardScreen() {
  const { setScreen, setSelectedId, user } = useApp();

  const stats = [
    {
      label: 'Campagnes actives',
      value: dashboardStats.activeCampaigns,
      icon: ClipboardList,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Total panneaux',
      value: dashboardStats.totalPanels,
      icon: LayoutGrid,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Missions du jour',
      value: dashboardStats.missionsToday,
      icon: Users,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Couverture moyenne',
      value: `${dashboardStats.coverageRate}%`,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
  ];

  const activeCampaigns = mockCampaigns.filter((c) => c.status === 'active');
  const recentMissions = mockMissions.slice(0, 3);

  return (
    <MobileShell>
      <div className="p-4 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Bonjour, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Voici le résumé de vos campagnes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4">
                <div className={`h-10 w-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            );
          })}
        </div>

        {/* Alert */}
        {dashboardStats.pendingSync > 0 && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-orange-800">Synchronisation en attente</p>
                <p className="text-sm text-orange-700">
                  {dashboardStats.pendingSync} photos en attente de sync
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Active Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Campagnes actives</h2>
            <button
              onClick={() => setScreen('manager-campaigns')}
              className="text-sm text-primary hover:underline flex items-center"
            >
              Voir tout
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {activeCampaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => {
                  setSelectedId(campaign.id);
                  setScreen('manager-campaign-detail');
                }}
                className="w-full text-left"
              >
                <Card className="p-4 hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">{campaign.client}</p>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Couverture</span>
                    <span className="font-medium text-foreground">{campaign.coverageRate}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${campaign.coverageRate}%` }}
                    />
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Missions */}
        <div>
          <h2 className="font-semibold text-foreground mb-3">Missions récentes</h2>
          <div className="space-y-2">
            {recentMissions.map((mission) => (
              <Card key={mission.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {mission.agent.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{mission.agent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mission.zone.name} - {mission.completedPanels}/{mission.panels.length} panneaux
                    </p>
                  </div>
                  <StatusBadge status={mission.status} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
