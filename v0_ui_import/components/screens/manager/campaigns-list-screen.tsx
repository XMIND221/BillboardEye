'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockCampaigns } from '@/lib/mock-data';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, LayoutGrid, ChevronRight, Building2 } from 'lucide-react';
import type { CampaignStatus } from '@/lib/types';

type FilterTab = 'all' | CampaignStatus;

export function CampaignsListScreen() {
  const { setScreen, setSelectedId } = useApp();
  const [filter, setFilter] = useState<FilterTab>('all');

  const filteredCampaigns = mockCampaigns.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const handleCampaignClick = (campaignId: string) => {
    setSelectedId(campaignId);
    setScreen('manager-campaign-detail');
  };

  return (
    <MobileShell>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Campagnes</h1>
            <p className="text-sm text-muted-foreground">
              {mockCampaigns.length} campagnes au total
            </p>
          </div>
          <Button onClick={() => setScreen('manager-campaign-create')} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nouvelle
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Toutes</TabsTrigger>
            <TabsTrigger value="active" className="flex-1">Actives</TabsTrigger>
            <TabsTrigger value="draft" className="flex-1">Brouillons</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">Terminées</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Campaigns List */}
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => handleCampaignClick(campaign.id)}
              className="w-full text-left"
            >
              <Card className="p-4 hover:border-primary/50 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{campaign.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="truncate">{campaign.client}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={campaign.status} />
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(campaign.startDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {' - '}
                      {new Date(campaign.endDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4" />
                    <span>{campaign.panelCount} panneaux</span>
                  </div>
                </div>

                {/* Progress */}
                {campaign.status !== 'draft' && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Couverture</span>
                      <span className="font-medium text-foreground">{campaign.coverageRate}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${campaign.coverageRate}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Zones */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {campaign.zones.slice(0, 3).map((zone) => (
                    <span
                      key={zone.id}
                      className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded"
                    >
                      {zone.name}
                    </span>
                  ))}
                  {campaign.zones.length > 3 && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      +{campaign.zones.length - 3}
                    </span>
                  )}
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
