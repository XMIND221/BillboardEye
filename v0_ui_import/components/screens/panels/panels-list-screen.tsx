'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockPanels, mockZones } from '@/lib/mock-data';
import {
  Search,
  Plus,
  MapPin,
  ChevronRight,
  Filter,
  Camera,
  Wifi,
  WifiOff,
} from 'lucide-react';

export function PanelsListScreen() {
  const { setScreen, setSelectedId, role } = useApp();
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const filteredPanels = mockPanels.filter((panel) => {
    const matchesSearch =
      panel.code.toLowerCase().includes(search.toLowerCase()) ||
      panel.address.toLowerCase().includes(search.toLowerCase());
    const matchesZone = !selectedZone || panel.zone.id === selectedZone;
    return matchesSearch && matchesZone;
  });

  const handlePanelClick = (panelId: string) => {
    setSelectedId(panelId);
    setScreen('panels-photos');
  };

  return (
    <MobileShell>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Panneaux</h1>
            <p className="text-sm text-muted-foreground">
              {mockPanels.length} panneaux référencés
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScreen('panels-sync')}
            >
              <Wifi className="h-4 w-4" />
            </Button>
            {role === 'manager' && (
              <Button onClick={() => setScreen('panels-create')} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nouveau
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un panneau..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Zone Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
          <button
            onClick={() => setSelectedZone(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              !selectedZone
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Toutes les zones
          </button>
          {mockZones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedZone === zone.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {zone.name}
            </button>
          ))}
        </div>

        {/* Panels List */}
        <div className="space-y-2">
          {filteredPanels.map((panel) => {
            const hasPhotos = panel.photos && panel.photos.length > 0;
            const hasPendingSync = panel.photos?.some((p) => !p.synced);

            return (
              <button
                key={panel.id}
                onClick={() => handlePanelClick(panel.id)}
                className="w-full text-left"
              >
                <Card className="p-3 hover:border-primary/50 transition-all group">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${
                        hasPhotos ? 'bg-green-100' : 'bg-muted'
                      }`}
                    >
                      {hasPhotos ? (
                        <Camera className="h-5 w-5 text-green-600" />
                      ) : (
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground">{panel.code}</p>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {panel.type}
                        </span>
                        {hasPendingSync && (
                          <WifiOff className="h-3.5 w-3.5 text-orange-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{panel.address}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{panel.zone.name}, {panel.zone.city}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={panel.status} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
