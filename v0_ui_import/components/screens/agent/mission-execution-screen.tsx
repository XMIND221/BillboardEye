'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockMissions, mockPanels } from '@/lib/mock-data';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Image,
  AlertCircle,
  X,
} from 'lucide-react';

export function MissionExecutionScreen() {
  const { setScreen, selectedId } = useApp();
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [faceAPhoto, setFaceAPhoto] = useState<string | null>(null);
  const [faceBPhoto, setFaceBPhoto] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const mission = mockMissions.find((m) => m.id === selectedId) || mockMissions[0];
  const panels = mockPanels.filter((p) => p.zone.id === mission.zone.id);
  const currentPanel = panels[currentPanelIndex];

  const handleTakePhoto = (face: 'A' | 'B') => {
    // Simulate taking a photo
    const mockPhotoUrl = '/placeholder.svg';
    if (face === 'A') {
      setFaceAPhoto(mockPhotoUrl);
    } else {
      setFaceBPhoto(mockPhotoUrl);
    }
  };

  const handleNextPanel = () => {
    if (currentPanelIndex < panels.length - 1) {
      setCurrentPanelIndex(currentPanelIndex + 1);
      setFaceAPhoto(null);
      setFaceBPhoto(null);
    } else {
      setScreen('agent-mission-completed');
    }
  };

  const handlePrevPanel = () => {
    if (currentPanelIndex > 0) {
      setCurrentPanelIndex(currentPanelIndex - 1);
      setFaceAPhoto(null);
      setFaceBPhoto(null);
    }
  };

  const canProceed = faceAPhoto !== null;

  return (
    <MobileShell
      title={`Panneau ${currentPanelIndex + 1}/${panels.length}`}
      onBack={() => setShowConfirm(true)}
      showNav={false}
    >
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Quitter la mission ?</h3>
                <p className="text-sm text-muted-foreground">Vos photos non sauvegardées seront perdues.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                Annuler
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => setScreen('agent-mission-detail')}>
                Quitter
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${((currentPanelIndex + 1) / panels.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {currentPanelIndex + 1}/{panels.length}
          </span>
        </div>

        {/* Panel Info */}
        <Card className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-bold text-lg text-foreground">{currentPanel.code}</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {currentPanel.type}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{currentPanel.address}</span>
          </div>
        </Card>

        {/* Photo Placeholders */}
        <div className="grid grid-cols-2 gap-3">
          {/* Face A */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Face A *</p>
            <div
              className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                faceAPhoto
                  ? 'border-green-500 bg-green-50'
                  : 'border-border bg-muted/50 hover:border-primary hover:bg-primary/5'
              }`}
            >
              {faceAPhoto ? (
                <div className="relative w-full h-full p-2">
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <button
                    onClick={() => setFaceAPhoto(null)}
                    className="absolute top-3 left-3 h-6 w-6 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleTakePhoto('A')}
                  className="flex flex-col items-center gap-2 p-4"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Prendre photo</span>
                </button>
              )}
            </div>
          </div>

          {/* Face B */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Face B (optionnel)</p>
            <div
              className={`aspect-[3/4] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                faceBPhoto
                  ? 'border-green-500 bg-green-50'
                  : 'border-border bg-muted/50 hover:border-primary hover:bg-primary/5'
              }`}
            >
              {faceBPhoto ? (
                <div className="relative w-full h-full p-2">
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                  <button
                    onClick={() => setFaceBPhoto(null)}
                    className="absolute top-3 left-3 h-6 w-6 rounded-full bg-black/50 flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleTakePhoto('B')}
                  className="flex flex-col items-center gap-2 p-4"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Prendre photo</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handlePrevPanel}
            disabled={currentPanelIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <Button
            onClick={handleNextPanel}
            disabled={!canProceed}
            className="flex-1"
          >
            {currentPanelIndex === panels.length - 1 ? 'Terminer' : 'Suivant'}
            {currentPanelIndex < panels.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          * La photo Face A est obligatoire pour valider ce panneau
        </p>
      </div>
    </MobileShell>
  );
}
