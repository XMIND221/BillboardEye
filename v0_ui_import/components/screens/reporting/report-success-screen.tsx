'use client';

import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Download, Share2, FileText, Home } from 'lucide-react';
import { mockCampaigns } from '@/lib/mock-data';

export function ReportSuccessScreen() {
  const { setScreen, selectedId, role } = useApp();

  const campaign = mockCampaigns.find((c) => c.id === selectedId) || mockCampaigns[0];

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Success Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 pt-16 pb-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Rapport généré !</h1>
          <p className="text-white/90 text-sm">
            Votre rapport PDF est prêt à être téléchargé ou partagé
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 -mt-12 px-4 pb-8">
        {/* Report Card */}
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground">{campaign.name}</h2>
              <p className="text-sm text-muted-foreground">{campaign.client}</p>
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Rapport_Campagne_{campaign.id}.pdf</span>
              <br />
              Généré le{' '}
              {new Date().toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Partager
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-3">Contenu du rapport</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{campaign.coverageRate}%</p>
              <p className="text-xs text-muted-foreground">Couverture</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">{campaign.panelCount}</p>
              <p className="text-xs text-muted-foreground">Panneaux</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">{campaign.zones.length}</p>
              <p className="text-xs text-muted-foreground">Zones</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">48</p>
              <p className="text-xs text-muted-foreground">Photos</p>
            </div>
          </div>
        </Card>

        {/* Return Button */}
        <Button
          onClick={() => setScreen(role === 'manager' ? 'manager-dashboard' : 'agent-missions')}
          className="w-full"
          size="lg"
        >
          <Home className="h-4 w-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
}
