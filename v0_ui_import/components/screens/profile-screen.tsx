'use client';

import { useApp } from '@/lib/app-context';
import { MobileShell } from '@/components/layout/mobile-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Smartphone,
  FileText,
} from 'lucide-react';

export function ProfileScreen() {
  const { user, role, logout } = useApp();

  const menuItems = [
    {
      section: 'Compte',
      items: [
        { icon: User, label: 'Informations personnelles', onClick: () => {} },
        { icon: Bell, label: 'Notifications', onClick: () => {} },
        { icon: Shield, label: 'Sécurité', onClick: () => {} },
      ],
    },
    {
      section: 'Application',
      items: [
        { icon: Moon, label: 'Apparence', onClick: () => {} },
        { icon: Smartphone, label: 'Mode hors-ligne', onClick: () => {} },
      ],
    },
    {
      section: 'Aide',
      items: [
        { icon: HelpCircle, label: 'Centre d\'aide', onClick: () => {} },
        { icon: FileText, label: 'Conditions d\'utilisation', onClick: () => {} },
      ],
    },
  ];

  return (
    <MobileShell>
      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">
                {user?.name.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{user?.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {role === 'manager' ? 'Manager' : 'Agent terrain'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">47</p>
            <p className="text-xs text-muted-foreground">Missions</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">312</p>
            <p className="text-xs text-muted-foreground">Photos</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">8</p>
            <p className="text-xs text-muted-foreground">Rapports</p>
          </Card>
        </div>

        {/* Menu */}
        {menuItems.map((section) => (
          <div key={section.section}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.section}
            </h3>
            <Card>
              {section.items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                      index !== section.items.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-left font-medium text-foreground">
                      {item.label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                );
              })}
            </Card>
          </div>
        ))}

        {/* Logout */}
        <Button variant="destructive" onClick={logout} className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          BillboardEye v1.0.0
          <br />
          Développé avec soin
        </p>
      </div>
    </MobileShell>
  );
}
