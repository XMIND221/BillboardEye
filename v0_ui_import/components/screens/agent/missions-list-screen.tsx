'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/list-states';
import { mockMissions } from '@/lib/mock-data';
import { MapPin, Calendar, ChevronRight, LayoutGrid, ClipboardList } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewState = 'loading' | 'error' | 'empty' | 'data';
type FilterTab = 'all' | 'pending' | 'in_progress' | 'completed';

export function MissionsListScreen() {
  const { setScreen, setSelectedId } = useApp();
  const [viewState, setViewState] = useState<ViewState>('data');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredMissions = mockMissions.filter((m) => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const handleMissionClick = (missionId: string) => {
    setSelectedId(missionId);
    setScreen('agent-mission-detail');
  };

  // Demo controls for states
  const toggleState = () => {
    const states: ViewState[] = ['data', 'loading', 'empty', 'error'];
    const currentIndex = states.indexOf(viewState);
    setViewState(states[(currentIndex + 1) % states.length]);
  };

  return (
    <MobileShell>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Mes Missions</h1>
            <p className="text-sm text-muted-foreground">
              {mockMissions.length} missions assignées
            </p>
          </div>
          <button
            onClick={toggleState}
            className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded"
          >
            État: {viewState}
          </button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Toutes</TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">En attente</TabsTrigger>
            <TabsTrigger value="in_progress" className="flex-1">En cours</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Terminées</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content based on state */}
        {viewState === 'loading' && <LoadingState message="Chargement des missions..." />}
        
        {viewState === 'error' && (
          <ErrorState
            title="Erreur de chargement"
            message="Impossible de récupérer vos missions. Vérifiez votre connexion."
            onRetry={() => setViewState('data')}
          />
        )}
        
        {viewState === 'empty' && (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6 text-muted-foreground" />}
            title="Aucune mission"
            description="Vous n'avez pas encore de missions assignées. Contactez votre responsable."
          />
        )}

        {viewState === 'data' && (
          <div className="space-y-3">
            {filteredMissions.length === 0 ? (
              <EmptyState
                title="Aucune mission"
                description="Aucune mission ne correspond à ce filtre."
              />
            ) : (
              filteredMissions.map((mission) => (
                <button
                  key={mission.id}
                  onClick={() => handleMissionClick(mission.id)}
                  className="w-full text-left"
                >
                  <Card className="p-4 hover:border-primary/50 transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">
                          {mission.campaign.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {mission.campaign.client}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={mission.status} />
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{mission.zone.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LayoutGrid className="h-4 w-4" />
                        <span>{mission.completedPanels}/{mission.panels.length} panneaux</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{
                            width: `${(mission.completedPanels / mission.panels.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Assignée le {new Date(mission.assignedAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </Card>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
