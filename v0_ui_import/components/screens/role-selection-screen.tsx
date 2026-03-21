'use client';

import { useApp } from '@/lib/app-context';
import { Card } from '@/components/ui/card';
import { ClipboardList, BarChart3, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RoleSelectionScreen() {
  const { user, selectRole, logout } = useApp();

  const roles = [
    {
      id: 'agent' as const,
      title: 'Espace Agent',
      description: 'Gérer vos missions terrain, photographier les panneaux et synchroniser vos données',
      icon: ClipboardList,
      features: ['Missions assignées', 'Prise de photos', 'Mode hors-ligne'],
    },
    {
      id: 'manager' as const,
      title: 'Espace Manager',
      description: 'Superviser les campagnes, assigner les missions et générer les rapports',
      icon: BarChart3,
      features: ['Tableau de bord', 'Gestion campagnes', 'Reporting'],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="h-24 bg-gradient-to-br from-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6TTIwIDIwaDIwdjIwSDIweiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      </div>

      {/* Content */}
      <div className="flex-1 -mt-8 px-4 pb-8">
        {/* User Card */}
        <Card className="p-4 mb-6 max-w-sm mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold text-lg">
                {user?.name.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Title */}
        <div className="text-center mb-6 max-w-sm mx-auto">
          <h1 className="text-xl font-bold text-foreground mb-1">Choisissez votre espace</h1>
          <p className="text-sm text-muted-foreground">
            Sélectionnez le mode d'utilisation adapté à votre rôle
          </p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4 max-w-sm mx-auto">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => selectRole(role.id)}
                className="w-full text-left"
              >
                <Card className="p-5 hover:border-primary/50 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="font-semibold text-foreground">{role.title}</h2>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {role.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
