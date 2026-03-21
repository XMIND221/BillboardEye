'use client';

import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockMissions, mockPanels } from '@/lib/mock-data';
import {
  MapPin,
  Calendar,
  LayoutGrid,
  User,
  Building2,
  Play,
  CheckCircle2,
  Clock,
  Camera,
} from 'lucide-react';

export function MissionDetailScreen() {
  const { setScreen, selectedId } = useApp();

  const mission = mockMissions.find((m) => m.id === selectedId) || mockMissions[0];
  const panels = mockPanels.filter((p) => p.zone.id === mission.zone.id);

  const handleStartMission = () => {
    setScreen('agent-mission-execution');
  };

  const progress = (mission.completedPanels / mission.panels.length) * 100;

  return (
    <MobileShell
      title="Détail Mission"
      onBack={() => setScreen('agent-missions')}
    >
      <div className="p-4 space-y-4">
        {/* Campaign Header */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{mission.campaign.name}</h2>
              <p className="text-sm text-muted-foreground">{mission.campaign.client}</p>
            </div>
            <StatusBadge status={mission.status} />
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium text-foreground">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Zone</p>
                <p className="font-medium text-foreground">{mission.zone.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Panneaux</p>
                <p className="font-medium text-foreground">{mission.completedPanels}/{panels.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Dates</p>
                <p className="font-medium text-foreground">
                  {new Date(mission.campaign.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  {' - '}
                  {new Date(mission.campaign.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Ville</p>
                <p className="font-medium text-foreground">{mission.zone.city}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Panels List */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Panneaux à contrôler</h3>
          <div className="space-y-2">
            {panels.map((panel, index) => {
              const isCompleted = index < mission.completedPanels;
              return (
                <Card
                  key={panel.id}
                  className={`p-3 ${isCompleted ? 'bg-green-50/50 border-green-200' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        isCompleted ? 'bg-green-100' : 'bg-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{panel.code}</p>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {panel.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{panel.address}</p>
                    </div>
                    <StatusBadge status={panel.status} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        {mission.status !== 'completed' && (
          <div className="sticky bottom-20 pt-4 bg-gradient-to-t from-background via-background to-transparent">
            <Button onClick={handleStartMission} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              {mission.status === 'pending' ? 'Démarrer la mission' : 'Continuer la mission'}
            </Button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
