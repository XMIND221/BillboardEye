'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CloudOff,
  Check,
  AlertCircle,
  Camera,
  Download,
  Upload,
} from 'lucide-react';

export function PanelSyncScreen() {
  const { setScreen, syncStatus, setSyncStatus } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Mock sync data
  const pendingPhotos = 12;
  const pendingMissions = 2;
  const lastSyncTime = '21 mars 2026, 10:30';

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncProgress(0);

    // Simulate sync progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setSyncProgress(i);
    }

    setSyncStatus('online');
    setIsSyncing(false);
  };

  const toggleOnlineMode = () => {
    setSyncStatus(syncStatus === 'online' ? 'offline' : 'online');
  };

  return (
    <MobileShell title="Synchronisation" onBack={() => setScreen('panels-list')}>
      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card
          className={`p-5 ${
            syncStatus === 'online'
              ? 'bg-green-50 border-green-200'
              : syncStatus === 'syncing'
              ? 'bg-blue-50 border-blue-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`h-14 w-14 rounded-full flex items-center justify-center ${
                syncStatus === 'online'
                  ? 'bg-green-100'
                  : syncStatus === 'syncing'
                  ? 'bg-blue-100'
                  : 'bg-orange-100'
              }`}
            >
              {syncStatus === 'online' ? (
                <Wifi className="h-7 w-7 text-green-600" />
              ) : syncStatus === 'syncing' ? (
                <RefreshCw className="h-7 w-7 text-blue-600 animate-spin" />
              ) : (
                <WifiOff className="h-7 w-7 text-orange-600" />
              )}
            </div>
            <div>
              <h2
                className={`font-bold text-lg ${
                  syncStatus === 'online'
                    ? 'text-green-800'
                    : syncStatus === 'syncing'
                    ? 'text-blue-800'
                    : 'text-orange-800'
                }`}
              >
                {syncStatus === 'online'
                  ? 'Connecté'
                  : syncStatus === 'syncing'
                  ? 'Synchronisation...'
                  : 'Mode hors-ligne'}
              </h2>
              <p
                className={`text-sm ${
                  syncStatus === 'online'
                    ? 'text-green-700'
                    : syncStatus === 'syncing'
                    ? 'text-blue-700'
                    : 'text-orange-700'
                }`}
              >
                {syncStatus === 'online'
                  ? 'Toutes les données sont à jour'
                  : syncStatus === 'syncing'
                  ? `${syncProgress}% terminé`
                  : 'Données sauvegardées localement'}
              </p>
            </div>
          </div>

          {/* Progress bar during sync */}
          {syncStatus === 'syncing' && (
            <div className="mt-4">
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-200"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Pending Items */}
        {syncStatus !== 'online' && (
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              En attente de synchronisation
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Photos</p>
                    <p className="text-xs text-muted-foreground">En attente d'envoi</p>
                  </div>
                </div>
                <span className="font-bold text-orange-600">{pendingPhotos}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Missions</p>
                    <p className="text-xs text-muted-foreground">Données non envoyées</p>
                  </div>
                </div>
                <span className="font-bold text-orange-600">{pendingMissions}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Last Sync Info */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Historique</h3>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Dernière synchronisation</p>
              <p className="text-sm text-muted-foreground">{lastSyncTime}</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleSync}
            className="w-full"
            size="lg"
            disabled={isSyncing || syncStatus === 'offline'}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Synchronisation en cours...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Synchroniser maintenant
              </>
            )}
          </Button>

          <Button variant="outline" onClick={toggleOnlineMode} className="w-full">
            {syncStatus === 'online' ? (
              <>
                <CloudOff className="h-4 w-4 mr-2" />
                Passer en mode hors-ligne
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                Activer le mode en ligne
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">Mode hors-ligne</p>
              <p className="text-sm text-blue-700">
                En mode hors-ligne, vos photos et données de mission sont sauvegardées
                localement. Elles seront automatiquement envoyées dès que vous serez
                reconnecté.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MobileShell>
  );
}
