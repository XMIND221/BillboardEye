'use client';

import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Home, Camera, Clock, MapPin, Share2 } from 'lucide-react';
import { mockMissions } from '@/lib/mock-data';

export function MissionCompletedScreen() {
  const { setScreen, selectedId, syncStatus } = useApp();

  const mission = mockMissions.find((m) => m.id === selectedId) || mockMissions[0];

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 pt-12 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Mission terminée !</h1>
          <p className="text-white/90 text-sm">
            Tous les panneaux ont été photographiés avec succès
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 -mt-12 px-4 pb-8">
        {/* Summary Card */}
        <Card className="p-5 mb-4">
          <h2 className="font-semibold text-foreground mb-4">{mission.campaign.name}</h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Camera className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Photos prises</p>
                <p className="font-semibold text-foreground">{mission.panels.length * 2} photos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Zone couverte</p>
                <p className="font-semibold text-foreground">{mission.zone.name}, {mission.zone.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminée le</p>
                <p className="font-semibold text-foreground">
                  {new Date().toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Sync Status */}
        <Card className={`p-4 mb-6 ${syncStatus === 'online' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${syncStatus === 'online' ? 'bg-green-100' : 'bg-orange-100'}`}>
              <Share2 className={`h-5 w-5 ${syncStatus === 'online' ? 'text-green-600' : 'text-orange-600'}`} />
            </div>
            <div>
              <p className={`font-medium ${syncStatus === 'online' ? 'text-green-800' : 'text-orange-800'}`}>
                {syncStatus === 'online' ? 'Données synchronisées' : 'En attente de synchronisation'}
              </p>
              <p className={`text-sm ${syncStatus === 'online' ? 'text-green-700' : 'text-orange-700'}`}>
                {syncStatus === 'online'
                  ? 'Toutes les photos ont été envoyées au serveur'
                  : 'Les photos seront envoyées dès la reconnexion'}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={() => setScreen('agent-missions')} className="w-full" size="lg">
            <Home className="h-4 w-4 mr-2" />
            Retour aux missions
          </Button>
          <Button
            variant="outline"
            onClick={() => setScreen('reporting-campaign-select')}
            className="w-full"
          >
            Créer un rapport
          </Button>
        </div>
      </div>
    </div>
  );
}
