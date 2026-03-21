'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { mockCampaigns, mockReport } from '@/lib/mock-data';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  TrendingUp,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  X,
  GripVertical,
  Eye,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

type ReportBlock = {
  id: string;
  type: 'coverage' | 'summary' | 'zones' | 'legends';
  enabled: boolean;
  collapsed: boolean;
};

export function ReportEditorScreen() {
  const { setScreen, selectedId } = useApp();
  const campaign = mockCampaigns.find((c) => c.id === selectedId) || mockCampaigns[0];

  const [blocks, setBlocks] = useState<ReportBlock[]>([
    { id: 'coverage', type: 'coverage', enabled: true, collapsed: false },
    { id: 'summary', type: 'summary', enabled: true, collapsed: false },
    { id: 'zones', type: 'zones', enabled: true, collapsed: false },
    { id: 'legends', type: 'legends', enabled: true, collapsed: false },
  ]);

  const [summary, setSummary] = useState(mockReport.summary);
  const [legends, setLegends] = useState(mockReport.legends);
  const [newLegend, setNewLegend] = useState('');

  const toggleBlock = (blockId: string) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, collapsed: !b.collapsed } : b)));
  };

  const addLegend = () => {
    if (newLegend.trim()) {
      setLegends([...legends, newLegend.trim()]);
      setNewLegend('');
    }
  };

  const removeLegend = (index: number) => {
    setLegends(legends.filter((_, i) => i !== index));
  };

  const blockConfig = {
    coverage: {
      title: 'Taux de couverture',
      icon: TrendingUp,
      description: 'Affiche le pourcentage de panneaux vérifiés',
    },
    summary: {
      title: 'Résumé',
      icon: FileText,
      description: 'Texte de synthèse de la campagne',
    },
    zones: {
      title: 'Détail par zone',
      icon: MapPin,
      description: 'Statistiques et photos par zone',
    },
    legends: {
      title: 'Légendes',
      icon: MessageSquare,
      description: 'Notes et annotations du rapport',
    },
  };

  return (
    <MobileShell
      title="Éditeur de rapport"
      onBack={() => setScreen('reporting-campaign-select')}
      showNav={false}
    >
      <div className="p-4 space-y-4">
        {/* Campaign Info */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Rapport pour</p>
          <h2 className="font-bold text-foreground">{campaign.name}</h2>
          <p className="text-sm text-muted-foreground">{campaign.client}</p>
        </Card>

        {/* Blocks */}
        <div className="space-y-3">
          {blocks.map((block) => {
            const config = blockConfig[block.type];
            const Icon = config.icon;

            return (
              <Card key={block.id} className="overflow-hidden">
                {/* Block Header */}
                <button
                  onClick={() => toggleBlock(block.id)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{config.title}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  {block.collapsed ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                {/* Block Content */}
                {!block.collapsed && (
                  <div className="px-4 pb-4 pt-0">
                    {block.type === 'coverage' && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Taux actuel</span>
                          <span className="text-2xl font-bold text-primary">
                            {campaign.coverageRate}%
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${campaign.coverageRate}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {campaign.completedPanels} / {campaign.panelCount} panneaux
                        </p>
                      </div>
                    )}

                    {block.type === 'summary' && (
                      <FieldGroup>
                        <Field>
                          <FieldLabel>Texte de synthèse</FieldLabel>
                          <Textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            rows={4}
                            placeholder="Rédigez un résumé de la campagne..."
                          />
                        </Field>
                      </FieldGroup>
                    )}

                    {block.type === 'zones' && (
                      <div className="space-y-2">
                        {campaign.zones.map((zone) => (
                          <div
                            key={zone.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-foreground text-sm">{zone.name}</p>
                              <p className="text-xs text-muted-foreground">{zone.city}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {zone.panelCount} panneaux
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {block.type === 'legends' && (
                      <div className="space-y-3">
                        {legends.map((legend, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                          >
                            <span className="flex-1 text-sm text-foreground">{legend}</span>
                            <button
                              onClick={() => removeLegend(index)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Ajouter une légende..."
                            value={newLegend}
                            onChange={(e) => setNewLegend(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addLegend()}
                          />
                          <Button size="icon" variant="outline" onClick={addLegend}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Preview Button */}
        <div className="sticky bottom-4 pt-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button onClick={() => setScreen('reporting-preview')} className="w-full" size="lg">
            <Eye className="h-4 w-4 mr-2" />
            Aperçu du rapport
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}
