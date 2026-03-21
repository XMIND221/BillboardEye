'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockZones } from '@/lib/mock-data';
import { Search, MapPin, LayoutGrid, Check, ChevronRight } from 'lucide-react';

export function ZoneSelectionScreen() {
  const { setScreen } = useApp();
  const [search, setSearch] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);

  const filteredZones = mockZones.filter(
    (zone) =>
      zone.name.toLowerCase().includes(search.toLowerCase()) ||
      zone.city.toLowerCase().includes(search.toLowerCase())
  );

  const toggleZone = (zoneId: string) => {
    setSelectedZones((prev) =>
      prev.includes(zoneId)
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const groupedZones = filteredZones.reduce((acc, zone) => {
    if (!acc[zone.city]) {
      acc[zone.city] = [];
    }
    acc[zone.city].push(zone);
    return acc;
  }, {} as Record<string, typeof mockZones>);

  return (
    <MobileShell title="Sélection zone" onBack={() => setScreen('agent-missions')}>
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        {selectedZones.length > 0 && (
          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
            <span className="text-sm font-medium text-primary">
              {selectedZones.length} zone(s) sélectionnée(s)
            </span>
            <button
              onClick={() => setSelectedZones([])}
              className="text-sm text-primary hover:underline"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Zones by city */}
        <div className="space-y-4">
          {Object.entries(groupedZones).map(([city, zones]) => (
            <div key={city}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {city}
              </h3>
              <div className="space-y-2">
                {zones.map((zone) => {
                  const isSelected = selectedZones.includes(zone.id);
                  return (
                    <button
                      key={zone.id}
                      onClick={() => toggleZone(zone.id)}
                      className="w-full text-left"
                    >
                      <Card
                        className={`p-3 transition-all ${
                          isSelected ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-border'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{zone.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <LayoutGrid className="h-3 w-3" />
                              <span>{zone.panelCount} panneaux</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Confirm button */}
        {selectedZones.length > 0 && (
          <div className="sticky bottom-20 pt-4 bg-gradient-to-t from-background via-background to-transparent">
            <Button onClick={() => setScreen('agent-missions')} className="w-full" size="lg">
              Confirmer la sélection ({selectedZones.length})
            </Button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
