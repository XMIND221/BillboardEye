'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { mockZones } from '@/lib/mock-data';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Check, Calendar, Building2, FileText, MapPin, LayoutGrid } from 'lucide-react';

export function CampaignCreateScreen() {
  const { setScreen } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    startDate: '',
    endDate: '',
    selectedZones: [] as string[],
  });

  const toggleZone = (zoneId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedZones: prev.selectedZones.includes(zoneId)
        ? prev.selectedZones.filter((id) => id !== zoneId)
        : [...prev.selectedZones, zoneId],
    }));
  };

  const totalPanels = mockZones
    .filter((z) => formData.selectedZones.includes(z.id))
    .reduce((sum, z) => sum + z.panelCount, 0);

  const handleSubmit = () => {
    // Mock submit - would normally call API
    setScreen('manager-campaigns');
  };

  return (
    <MobileShell
      title="Nouvelle campagne"
      onBack={() => setScreen('manager-campaigns')}
      showNav={false}
    >
      <div className="p-4">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Informations générales
              </h2>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nom de la campagne *</FieldLabel>
                  <Input
                    id="name"
                    placeholder="Ex: Lancement Produit Été 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="client">Client *</FieldLabel>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="client"
                      placeholder="Nom du client"
                      value={formData.client}
                      onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Description (optionnel)</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Décrivez brièvement la campagne..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </Field>
              </FieldGroup>
            </Card>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={!formData.name || !formData.client}
            >
              Continuer
            </Button>
          </div>
        )}

        {/* Step 2: Dates */}
        {step === 2 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Période de diffusion
              </h2>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="startDate">Date de début *</FieldLabel>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="endDate">Date de fin *</FieldLabel>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </Field>
              </FieldGroup>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
                disabled={!formData.startDate || !formData.endDate}
              >
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Zones Selection */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Sélection des zones
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez les zones de diffusion pour cette campagne
              </p>

              <div className="space-y-2">
                {mockZones.map((zone) => {
                  const isSelected = formData.selectedZones.includes(zone.id);
                  return (
                    <button
                      key={zone.id}
                      onClick={() => toggleZone(zone.id)}
                      className="w-full text-left"
                    >
                      <div
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-primary border-primary' : 'border-border'
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{zone.name}</p>
                            <p className="text-xs text-muted-foreground">{zone.city}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <LayoutGrid className="h-4 w-4" />
                            <span>{zone.panelCount}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Summary */}
            {formData.selectedZones.length > 0 && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total panneaux sélectionnés</span>
                  <span className="font-bold text-primary text-lg">{totalPanels}</span>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={formData.selectedZones.length === 0}
              >
                Créer la campagne
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
