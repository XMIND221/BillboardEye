'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, UserRole, SyncStatus } from './types';
import { mockUser, mockManager } from './mock-data';

type Screen =
  | 'login'
  | 'role-selection'
  // Agent screens
  | 'agent-missions'
  | 'agent-mission-detail'
  | 'agent-mission-execution'
  | 'agent-mission-completed'
  | 'agent-zone-selection'
  // Manager screens
  | 'manager-dashboard'
  | 'manager-campaigns'
  | 'manager-campaign-detail'
  | 'manager-campaign-create'
  // Panel screens
  | 'panels-list'
  | 'panels-create'
  | 'panels-photos'
  | 'panels-sync'
  // Reporting screens
  | 'reporting-campaign-select'
  | 'reporting-editor'
  | 'reporting-preview'
  | 'reporting-success'
  // Profile
  | 'profile';

interface AppContextType {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  role: UserRole | null;
  setRole: (role: UserRole | null) => void;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  selectRole: (role: UserRole) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const login = (email: string, _password: string): boolean => {
    // Mock login - accepts any credentials
    if (email.includes('manager')) {
      setUser(mockManager);
    } else {
      setUser(mockUser);
    }
    setScreen('role-selection');
    return true;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setScreen('login');
  };

  const selectRole = (selectedRole: UserRole) => {
    setRole(selectedRole);
    if (selectedRole === 'agent') {
      setScreen('agent-missions');
    } else {
      setScreen('manager-dashboard');
    }
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        user,
        setUser,
        role,
        setRole,
        syncStatus,
        setSyncStatus,
        selectedId,
        setSelectedId,
        login,
        logout,
        selectRole,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
