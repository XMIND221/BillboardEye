'use client';

import { useApp } from '@/lib/app-context';

// Auth screens
import { LoginScreen } from './screens/login-screen';
import { RoleSelectionScreen } from './screens/role-selection-screen';

// Agent screens
import { MissionsListScreen } from './screens/agent/missions-list-screen';
import { MissionDetailScreen } from './screens/agent/mission-detail-screen';
import { MissionExecutionScreen } from './screens/agent/mission-execution-screen';
import { MissionCompletedScreen } from './screens/agent/mission-completed-screen';
import { ZoneSelectionScreen } from './screens/agent/zone-selection-screen';

// Manager screens
import { DashboardScreen } from './screens/manager/dashboard-screen';
import { CampaignsListScreen } from './screens/manager/campaigns-list-screen';
import { CampaignCreateScreen } from './screens/manager/campaign-create-screen';
import { CampaignDetailScreen } from './screens/manager/campaign-detail-screen';

// Panel screens
import { PanelsListScreen } from './screens/panels/panels-list-screen';
import { PanelCreateScreen } from './screens/panels/panel-create-screen';
import { PanelPhotosScreen } from './screens/panels/panel-photos-screen';
import { PanelSyncScreen } from './screens/panels/panel-sync-screen';

// Reporting screens
import { ReportCampaignSelectScreen } from './screens/reporting/report-campaign-select-screen';
import { ReportEditorScreen } from './screens/reporting/report-editor-screen';
import { ReportPreviewScreen } from './screens/reporting/report-preview-screen';
import { ReportSuccessScreen } from './screens/reporting/report-success-screen';

// Profile
import { ProfileScreen } from './screens/profile-screen';

export function BillboardEyeApp() {
  const { screen } = useApp();

  const screens: Record<string, React.ReactNode> = {
    // Auth
    login: <LoginScreen />,
    'role-selection': <RoleSelectionScreen />,

    // Agent
    'agent-missions': <MissionsListScreen />,
    'agent-mission-detail': <MissionDetailScreen />,
    'agent-mission-execution': <MissionExecutionScreen />,
    'agent-mission-completed': <MissionCompletedScreen />,
    'agent-zone-selection': <ZoneSelectionScreen />,

    // Manager
    'manager-dashboard': <DashboardScreen />,
    'manager-campaigns': <CampaignsListScreen />,
    'manager-campaign-create': <CampaignCreateScreen />,
    'manager-campaign-detail': <CampaignDetailScreen />,

    // Panels
    'panels-list': <PanelsListScreen />,
    'panels-create': <PanelCreateScreen />,
    'panels-photos': <PanelPhotosScreen />,
    'panels-sync': <PanelSyncScreen />,

    // Reporting
    'reporting-campaign-select': <ReportCampaignSelectScreen />,
    'reporting-editor': <ReportEditorScreen />,
    'reporting-preview': <ReportPreviewScreen />,
    'reporting-success': <ReportSuccessScreen />,

    // Profile
    profile: <ProfileScreen />,
  };

  return <>{screens[screen] || <LoginScreen />}</>;
}
