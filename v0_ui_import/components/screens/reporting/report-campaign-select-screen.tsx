'use client';

import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockCampaigns } from '@/lib/mock-data';
import { FileText, ChevronRight, Calendar, LayoutGrid, TrendingUp } from 'lucide-react';

export function ReportCampaignSelectScreen() {
  const { setScreen, setSelectedId, role } = useApp();

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedId(campaignId);
    setScreen('reporting-editor');
  };

  // Only show active and completed campaigns for reporting
  const reportableCampaigns = mockCampaigns.filter(
    (c) => c.status === 'active' || c.status === 'completed'
  );

  return (
    <MobileShell title="Nouveau rapport" onBack={() => setScreen(role === 'manager' ? 'manager-dashboard' : 'agent-missions')}>
      <div className="p-4">
        <div className="mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Créer un rapport</h1>
          <p className="text-sm text-muted-foreground">
            Sélectionnez la campagne pour laquelle vous souhaitez générer un rapport
          </p>
        </div>

        <div className="space-y-3">
          {reportableCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => handleCampaignSelect(campaign.id)}
              className="w-full text-left"
            >
              <Card className="p-4 hover:border-primary/50 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">{campaign.client}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={campaign.status} />
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(campaign.startDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4" />
                    <span>{campaign.panelCount} panneaux</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    <span>{campaign.coverageRate}%</span>
                  </div>
                </div>
              </Card>
            </button>
          ))}

          {reportableCampaigns.length === 0 && (
            <Card className="p-6">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Aucune campagne active ou terminée disponible pour le reporting.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
