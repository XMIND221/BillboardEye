'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockZones } from '@/lib/mock-data';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import {
  MapPin,
  FileText,
  Check,
  Ruler,
} from 'lucide-react';

const panelTypes = [
  { id: '4x3', label: '4x3', description: 'Format standard' },
  { id: '8x3', label: '8x3', description: 'Grand format horizontal' },
  { id: '12x4', label: '12x4', description: 'Très grand format' },
  { id: 'abris', label: 'Abribus', description: 'Mobilier urbain' },
  { id: 'mobilier', label: 'Mobilier', description: 'Autres mobiliers' },
];

export function PanelCreateScreen() {
  const { setScreen } = useApp();
  const [formData, setFormData] = useState({
    code: '',
    address: '',
    zoneId: '',
    type: '',
  });

  const handleSubmit = () => {
    // Mock submit
    setScreen('panels-list');
  };

  const isValid = formData.code && formData.address && formData.zoneId && formData.type;

  return (
    <MobileShell
      title="Nouveau panneau"
      onBack={() => setScreen('panels-list')}
      showNav={false}
    >
      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Informations générales
          </h2>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Code panneau *</FieldLabel>
              <Input
                id="code"
                placeholder="Ex: PAR-CV-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format recommandé: VILLE-ZONE-NUMERO
              </p>
            </Field>
            <Field>
              <FieldLabel htmlFor="address">Adresse complète *</FieldLabel>
              <Input
                id="address"
                placeholder="12 Rue de la Paix, 75001 Paris"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Field>
          </FieldGroup>
        </Card>

        {/* Zone Selection */}
        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Zone géographique
          </h2>
          <div className="space-y-2">
            {mockZones.map((zone) => {
              const isSelected = formData.zoneId === zone.id;
              return (
                <button
                  key={zone.id}
                  onClick={() => setFormData({ ...formData, zoneId: zone.id })}
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
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-primary border-primary' : 'border-border'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{zone.name}</p>
                        <p className="text-xs text-muted-foreground">{zone.city}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Type Selection */}
        <Card className="p-4">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Type de panneau
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {panelTypes.map((type) => {
              const isSelected = formData.type === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-semibold text-foreground">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Submit */}
        <Button onClick={handleSubmit} className="w-full" size="lg" disabled={!isValid}>
          Créer le panneau
        </Button>
      </div>
    </MobileShell>
  );
}
