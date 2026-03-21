'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCampaigns, mockReport } from '@/lib/mock-data';
import {
  Download,
  Share2,
  Edit,
  Calendar,
  Building2,
  TrendingUp,
  MapPin,
  Image,
  FileText,
} from 'lucide-react';

export function ReportPreviewScreen() {
  const { setScreen, selectedId } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);

  const campaign = mockCampaigns.find((c) => c.id === selectedId) || mockCampaigns[0];

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate PDF generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setScreen('reporting-success');
  };

  return (
    <MobileShell
      title="Aperçu PDF"
      onBack={() => setScreen('reporting-editor')}
      showNav={false}
    >
      <div className="p-4 space-y-4">
        {/* PDF Preview Container */}
        <Card className="overflow-hidden">
          {/* PDF Header */}
          <div className="bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded bg-primary-foreground/20 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">BE</span>
              </div>
              <span className="font-semibold">BillboardEye</span>
            </div>
            <h1 className="text-xl font-bold">Rapport de campagne</h1>
          </div>

          {/* PDF Content */}
          <div className="p-4 space-y-6">
            {/* Campaign Info */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-2">{campaign.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{campaign.client}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(campaign.startDate).toLocaleDateString('fr-FR')} -{' '}
                    {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Coverage */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Taux de couverture</h3>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{campaign.coverageRate}%</span>
                <span className="text-sm text-muted-foreground mb-1">
                  ({campaign.completedPanels}/{campaign.panelCount} panneaux)
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${campaign.coverageRate}%` }}
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Résumé</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mockReport.summary}
              </p>
            </div>

            {/* Zones */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Détail par zone</h3>
              </div>
              <div className="space-y-2">
                {mockReport.zones.map((zoneReport, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{zoneReport.zone.name}</p>
                        <p className="text-xs text-muted-foreground">{zoneReport.zone.city}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {Math.round((zoneReport.completedCount / zoneReport.panelCount) * 100)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {zoneReport.completedCount}/{zoneReport.panelCount}
                        </p>
                      </div>
                    </div>
                    {/* Mock photo thumbnails */}
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-12 w-12 rounded bg-muted flex items-center justify-center"
                        >
                          <Image className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        +12
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legends */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Légendes</h3>
              <ul className="space-y-1">
                {mockReport.legends.map((legend, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {legend}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground">
              <p>
                Rapport généré le{' '}
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p>BillboardEye - Suivi de campagnes d'affichage</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-4">
          <Button variant="outline" onClick={() => setScreen('reporting-editor')} className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button onClick={handleGenerate} className="flex-1" disabled={isGenerating}>
            {isGenerating ? (
              'Génération...'
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Générer PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
