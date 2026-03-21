'use client';

import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockCampaigns, mockMissions } from '@/lib/mock-data';
import {
  Calendar,
  LayoutGrid,
  Building2,
  MapPin,
  Users,
  FileText,
  Edit,
  Pause,
  Play,
  BarChart3,
} from 'lucide-react';

export function CampaignDetailScreen() {
  const { setScreen, selectedId } = useApp();

  const campaign = mockCampaigns.find((c) => c.id === selectedId) || mockCampaigns[0];
  const campaignMissions = mockMissions.filter((m) => m.campaign.id === campaign.id);

  return (
    <MobileShell
      title="Détail campagne"
      onBack={() => setScreen('manager-campaigns')}
    >
      <div className="p-4 space-y-4">
        {/* Header Card */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{campaign.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{campaign.client}</span>
              </div>
            </div>
            <StatusBadge status={campaign.status} />
          </div>

          {/* Coverage Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Taux de couverture</span>
              <span className="font-bold text-foreground text-lg">{campaign.coverageRate}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${campaign.coverageRate}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign.completedPanels} / {campaign.panelCount} panneaux vérifiés
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
            {campaign.status === 'active' ? (
              <Button variant="outline" size="sm" className="flex-1">
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="flex-1">
                <Play className="h-4 w-4 mr-1" />
                Activer
              </Button>
            )}
          </div>
        </Card>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Période</span>
            </div>
            <p className="font-medium text-foreground text-sm">
              {new Date(campaign.startDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
              {' - '}
              {new Date(campaign.endDate).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Panneaux</span>
            </div>
            <p className="font-medium text-foreground text-sm">{campaign.panelCount} panneaux</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Zones</span>
            </div>
            <p className="font-medium text-foreground text-sm">{campaign.zones.length} zones</p>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Missions</span>
            </div>
            <p className="font-medium text-foreground text-sm">{campaignMissions.length} missions</p>
          </Card>
        </div>

        {/* Zones */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Zones de diffusion
          </h3>
          <div className="space-y-2">
            {campaign.zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground text-sm">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.city}</p>
                </div>
                <span className="text-sm text-muted-foreground">{zone.panelCount} panneaux</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Missions */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Missions assignées
          </h3>
          {campaignMissions.length > 0 ? (
            <div className="space-y-2">
              {campaignMissions.map((mission) => (
                <div key={mission.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-xs">
                      {mission.agent.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{mission.agent.name}</p>
                    <p className="text-xs text-muted-foreground">{mission.zone.name}</p>
                  </div>
                  <StatusBadge status={mission.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune mission assignée pour le moment
            </p>
          )}
        </Card>

        {/* Report Button */}
        <Button
          onClick={() => setScreen('reporting-campaign-select')}
          className="w-full"
          size="lg"
        >
          <FileText className="h-4 w-4 mr-2" />
          Générer un rapport
        </Button>
      </div>
    </MobileShell>
  );
}
