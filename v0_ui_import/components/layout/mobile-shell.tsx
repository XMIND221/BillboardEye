'use client';

import { useApp } from '@/lib/app-context';
import {
  Home,
  ClipboardList,
  LayoutGrid,
  FileText,
  User,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileShellProps {
  children: React.ReactNode;
  showNav?: boolean;
  showHeader?: boolean;
  title?: string;
  onBack?: () => void;
}

export function MobileShell({
  children,
  showNav = true,
  showHeader = true,
  title,
  onBack,
}: MobileShellProps) {
  const { role, screen, setScreen, syncStatus } = useApp();

  const agentNavItems = [
    { id: 'agent-missions', label: 'Missions', icon: ClipboardList },
    { id: 'panels-list', label: 'Panneaux', icon: LayoutGrid },
    { id: 'reporting-campaign-select', label: 'Rapports', icon: FileText },
    { id: 'profile', label: 'Profil', icon: User },
  ] as const;

  const managerNavItems = [
    { id: 'manager-dashboard', label: 'Tableau', icon: Home },
    { id: 'manager-campaigns', label: 'Campagnes', icon: ClipboardList },
    { id: 'panels-list', label: 'Panneaux', icon: LayoutGrid },
    { id: 'reporting-campaign-select', label: 'Rapports', icon: FileText },
    { id: 'profile', label: 'Profil', icon: User },
  ] as const;

  const navItems = role === 'manager' ? managerNavItems : agentNavItems;

  const SyncIndicator = () => {
    const statusConfig = {
      online: { icon: Wifi, color: 'text-green-500', bg: 'bg-green-50' },
      offline: { icon: WifiOff, color: 'text-orange-500', bg: 'bg-orange-50' },
      syncing: { icon: RefreshCw, color: 'text-primary', bg: 'bg-primary/10' },
    };
    const config = statusConfig[syncStatus];
    const Icon = config.icon;

    return (
      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium', config.bg, config.color)}>
        <Icon className={cn('h-3.5 w-3.5', syncStatus === 'syncing' && 'animate-spin')} />
        <span className="sr-only md:not-sr-only">
          {syncStatus === 'online' ? 'En ligne' : syncStatus === 'offline' ? 'Hors ligne' : 'Sync...'}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto border-x border-border">
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {title ? (
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">BE</span>
                  </div>
                  <span className="font-semibold text-foreground">BillboardEye</span>
                </div>
              )}
            </div>
            <SyncIndicator />
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-around h-16 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = screen === item.id || screen.startsWith(item.id.split('-')[0]);
                return (
                  <button
                    key={item.id}
                    onClick={() => setScreen(item.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
