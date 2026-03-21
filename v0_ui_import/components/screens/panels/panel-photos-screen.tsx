'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { mockPanels } from '@/lib/mock-data';
import {
  Camera,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Image,
  Check,
  Clock,
  WifiOff,
  Wifi,
} from 'lucide-react';

export function PanelPhotosScreen() {
  const { setScreen, selectedId } = useApp();
  const [photos, setPhotos] = useState(mockPanels[0].photos || []);

  const panel = mockPanels.find((p) => p.id === selectedId) || mockPanels[0];

  const handleAddPhoto = (face: 'A' | 'B') => {
    const newPhoto = {
      id: `photo-${Date.now()}`,
      url: '/placeholder.svg',
      face,
      takenAt: new Date().toISOString(),
      synced: false,
    };
    setPhotos([...photos, newPhoto]);
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
  };

  const faceAPhotos = photos.filter((p) => p.face === 'A');
  const faceBPhotos = photos.filter((p) => p.face === 'B');

  return (
    <MobileShell
      title={panel.code}
      onBack={() => setScreen('panels-list')}
    >
      <div className="p-4 space-y-4">
        {/* Panel Info */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-bold text-lg text-foreground">{panel.code}</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {panel.type}
              </span>
            </div>
            <StatusBadge status={panel.status} />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{panel.address}</span>
          </div>
          {panel.lastSync && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Clock className="h-3.5 w-3.5" />
              <span>
                Dernière sync: {new Date(panel.lastSync).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </Card>

        {/* Face A Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Face A</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPhoto('A')}
            >
              <Camera className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>

          {faceAPhotos.length === 0 ? (
            <Card className="p-6 border-dashed">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune photo pour la Face A</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {faceAPhotos.map((photo) => (
                <Card key={photo.id} className="relative overflow-hidden">
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {photo.synced ? (
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Wifi className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                        <WifiOff className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.takenAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="text-xs text-destructive hover:underline mt-1"
                    >
                      Supprimer
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Face B Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Face B (optionnel)</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPhoto('B')}
            >
              <Camera className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </div>

          {faceBPhotos.length === 0 ? (
            <Card className="p-6 border-dashed">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune photo pour la Face B</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {faceBPhotos.map((photo) => (
                <Card key={photo.id} className="relative overflow-hidden">
                  <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    {photo.synced ? (
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Wifi className="h-3 w-3 text-white" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center">
                        <WifiOff className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.takenAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="text-xs text-destructive hover:underline mt-1"
                    >
                      Supprimer
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
