import React, { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, Text, Platform } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { theme } from "./src/theme";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RoleGateScreen from "./src/screens/RoleGateScreen";
import ManagerDashboardScreen from "./src/screens/ManagerDashboardScreen";
import ManagerCampaignsScreen from "./src/screens/ManagerCampaignsScreen";
import ManagerCreateCampaignScreen from "./src/screens/ManagerCreateCampaignScreen";
import ManagerCampaignDetailScreen from "./src/screens/ManagerCampaignDetailScreen";
import ManagerPanneauxScreen from "./src/screens/ManagerPanneauxScreen";
import ManagerPanneauFormScreen from "./src/screens/ManagerPanneauFormScreen";
import ManagerPanneauxMapScreen from "./src/screens/ManagerPanneauxMapScreen";
import AgentMissionsScreen from "./src/screens/AgentMissionsScreen";
import AgentMissionDetailScreen from "./src/screens/AgentMissionDetailScreen";
import AgentZoneSelectionScreen from "./src/screens/AgentZoneSelectionScreen";
import AgentExecutionScreen from "./src/screens/AgentExecutionScreen";
import AgentMissionCompleteScreen from "./src/screens/AgentMissionCompleteScreen";
import AgentPanneauxScreen from "./src/screens/AgentPanneauxScreen";
import UploadPanneauScreen from "./src/screens/UploadPanneauScreen";
import ReportingGenerateScreen from "./src/screens/ReportingGenerateScreen";
import ReportingEditorScreen from "./src/screens/ReportingEditorScreen";
import ReportingPreviewScreen from "./src/screens/ReportingPreviewScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { clearAllSelectedProjects, clearUserRole, getUserRole, saveUserRole } from "./src/services/projectStorage";
import { MANAGER_REPORT_SCREENS, REPORTING_MODE_SCREENS } from "./src/features/navigation";
import ManagerHeaderActions from "./src/components/ManagerHeaderActions";
import { ToastProvider } from "./src/contexts/ToastContext";
import { NetworkSyncProvider } from "./src/contexts/NetworkSyncContext";
import { DemoProvider, useDemo } from "./src/contexts/DemoContext";

const RootStack = createNativeStackNavigator();
const ManagerDashboardStack = createNativeStackNavigator();
const ManagerCampaignsStack = createNativeStackNavigator();
const ManagerPanneauxStack = createNativeStackNavigator();
const ManagerRapportsStack = createNativeStackNavigator();
const ManagerProfilStack = createNativeStackNavigator();
const ManagerTab = createBottomTabNavigator();
const MissionsStack = createNativeStackNavigator();
const PanneauxStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ReportingStack = createNativeStackNavigator();
const AgentTab = createBottomTabNavigator();

const navigationLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.canvas,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.primary,
  },
};

const lightStackScreenOptions = {
  headerStyle: { backgroundColor: theme.colors.background },
  headerTintColor: theme.colors.primary,
  headerTitleStyle: { color: theme.colors.text, fontWeight: "600", fontSize: 17 },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerBackButtonDisplayMode: "minimal",
  animation: "slide_from_right",
  gestureEnabled: true,
  contentStyle: { backgroundColor: theme.colors.canvas },
};

const tabEmojiByName = {
  "home-outline": "🏠",
  "clipboard-outline": "📋",
  "grid-outline": "🧩",
  "document-text-outline": "📄",
  "person-outline": "👤",
};

function tabIcon(name, color, size) {
  if (Platform.OS === "web") {
    return (
      <Text style={{ fontSize: Math.max(14, size - 2), color }} accessibilityLabel={name}>
        {tabEmojiByName[name] || "•"}
      </Text>
    );
  }
  return <Ionicons name={name} size={size} color={color} />;
}

function ManagerDashboardStackNavigator() {
  return (
    <ManagerDashboardStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerShown: false }}>
      <ManagerDashboardStack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} />
    </ManagerDashboardStack.Navigator>
  );
}

function ManagerCampaignsStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ManagerCampaignsStack.Navigator
      screenOptions={{
        ...lightStackScreenOptions,
        headerRight: () => (
          <ManagerHeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />
        ),
      }}
    >
      <ManagerCampaignsStack.Screen name="ManagerCampaigns" options={{ headerShown: false }}>
        {(props) => (
          <ManagerCampaignsScreen
            {...props}
            userEmail={userEmail}
            onSwitchRole={onSwitchRole}
            onSignOut={onSignOut}
          />
        )}
      </ManagerCampaignsStack.Screen>
      <ManagerCampaignsStack.Screen name="ManagerCreateCampaign" component={ManagerCreateCampaignScreen} options={{ title: "Création campagne" }} />
      <ManagerCampaignsStack.Screen name="ManagerCampaignDetail" component={ManagerCampaignDetailScreen} options={{ title: "Détail campagne" }} />
    </ManagerCampaignsStack.Navigator>
  );
}

function ManagerPanneauxStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ManagerPanneauxStack.Navigator
      screenOptions={{
        ...lightStackScreenOptions,
        headerShown: false,
        headerRight: () => (
          <ManagerHeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />
        ),
      }}
    >
      <ManagerPanneauxStack.Screen name="ManagerPanneauxMain" component={ManagerPanneauxScreen} />
      <ManagerPanneauxStack.Screen name="ManagerPanneauForm" component={ManagerPanneauFormScreen} options={{ headerShown: false }} />
      <ManagerPanneauxStack.Screen name="ManagerPanneauxMap" component={ManagerPanneauxMapScreen} options={{ headerShown: false }} />
    </ManagerPanneauxStack.Navigator>
  );
}

function ManagerRapportsStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ManagerRapportsStack.Navigator
      screenOptions={{
        ...lightStackScreenOptions,
        headerRight: () => (
          <ManagerHeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />
        ),
      }}
    >
      <ManagerRapportsStack.Screen
        name={MANAGER_REPORT_SCREENS.Generate}
        component={ReportingGenerateScreen}
        options={{ headerShown: false }}
        initialParams={{ reportScreens: MANAGER_REPORT_SCREENS, reportingUiMode: "manager" }}
      />
      <ManagerRapportsStack.Screen
        name={MANAGER_REPORT_SCREENS.Editor}
        component={ReportingEditorScreen}
        initialParams={{ reportScreens: MANAGER_REPORT_SCREENS }}
        options={{ title: "Personnaliser rapport" }}
      />
      <ManagerRapportsStack.Screen name={MANAGER_REPORT_SCREENS.Preview} component={ReportingPreviewScreen} options={{ title: "Aperçu PDF" }} />
    </ManagerRapportsStack.Navigator>
  );
}

function ManagerProfilStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ManagerProfilStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerShown: false }}>
      <ManagerProfilStack.Screen name="ProfileMain">
        {(props) => <ProfileScreen {...props} userEmail={userEmail} onSignOut={onSignOut} onSwitchRole={onSwitchRole} />}
      </ManagerProfilStack.Screen>
    </ManagerProfilStack.Navigator>
  );
}

function ManagerTabNavigator({ onSwitchRole, onSignOut, userEmail }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const DashboardTab = useMemo(
    () =>
      function DashboardTabScreen() {
        return <ManagerDashboardStackNavigator />;
      },
    []
  );
  const CampaignsTab = useMemo(
    () =>
      function CampaignsTabScreen() {
        return <ManagerCampaignsStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
      },
    [onSwitchRole, onSignOut, userEmail]
  );
  const PanneauxTab = useMemo(
    () =>
      function PanneauxTabScreen() {
        return <ManagerPanneauxStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
      },
    [onSwitchRole, onSignOut, userEmail]
  );
  const RapportsTab = useMemo(
    () =>
      function RapportsTabScreen() {
        return <ManagerRapportsStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
      },
    [onSwitchRole, onSignOut, userEmail]
  );
  const ProfilTab = useMemo(
    () =>
      function ProfilTabScreen() {
        return <ManagerProfilStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
      },
    [onSwitchRole, onSignOut, userEmail]
  );

  return (
    <ManagerTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingTop: 4,
          paddingBottom: bottomInset - 4,
          height: 58 + bottomInset,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <ManagerTab.Screen
        name="ManagerDashboardTab"
        component={DashboardTab}
        options={{ title: "Tableau", tabBarIcon: ({ color, size }) => tabIcon("home-outline", color, size) }}
      />
      <ManagerTab.Screen
        name="ManagerCampaignsTab"
        component={CampaignsTab}
        options={{ title: "Campagnes", tabBarIcon: ({ color, size }) => tabIcon("clipboard-outline", color, size) }}
      />
      <ManagerTab.Screen
        name="ManagerPanneauxTab"
        component={PanneauxTab}
        options={{ title: "Panneaux", tabBarIcon: ({ color, size }) => tabIcon("grid-outline", color, size) }}
      />
      <ManagerTab.Screen
        name="ManagerRapportsTab"
        component={RapportsTab}
        options={{ title: "Rapports", tabBarIcon: ({ color, size }) => tabIcon("document-text-outline", color, size) }}
      />
      <ManagerTab.Screen
        name="ManagerProfilTab"
        component={ProfilTab}
        options={{ title: "Profil", tabBarIcon: ({ color, size }) => tabIcon("person-outline", color, size) }}
      />
    </ManagerTab.Navigator>
  );
}

function AgentMissionsStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <MissionsStack.Navigator
      screenOptions={{
        ...lightStackScreenOptions,
        headerRight: () => (
          <ManagerHeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />
        ),
      }}
    >
      <MissionsStack.Screen name="AgentMissions" component={AgentMissionsScreen} options={{ headerShown: false }} />
      <MissionsStack.Screen name="AgentMissionDetail" component={AgentMissionDetailScreen} options={{ title: "Détail mission" }} />
      <MissionsStack.Screen name="AgentZoneSelection" component={AgentZoneSelectionScreen} options={{ title: "Sélection zone" }} />
      <MissionsStack.Screen name="AgentExecution" component={AgentExecutionScreen} options={{ title: "Exécution terrain" }} />
      <MissionsStack.Screen name="AgentMissionComplete" component={AgentMissionCompleteScreen} options={{ title: "Fin mission" }} />
    </MissionsStack.Navigator>
  );
}

function AgentPanneauxStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <PanneauxStack.Navigator
      screenOptions={{
        ...lightStackScreenOptions,
        headerRight: () => (
          <ManagerHeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />
        ),
      }}
    >
      <PanneauxStack.Screen name="AgentPanneaux" component={AgentPanneauxScreen} options={{ headerShown: false }} />
      <PanneauxStack.Screen name="UploadPanneau" component={UploadPanneauScreen} options={{ title: "Mode upload" }} />
    </PanneauxStack.Navigator>
  );
}

function AgentProfileStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ProfileStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain">
        {(props) => <ProfileScreen {...props} userEmail={userEmail} onSignOut={onSignOut} onSwitchRole={onSwitchRole} />}
      </ProfileStack.Screen>
    </ProfileStack.Navigator>
  );
}

function AgentTabNavigator({ onSwitchRole, onSignOut, userEmail }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);
  const MissionsTab = useMemo(
    () =>
      function MissionsTabScreen() {
        return <AgentMissionsStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
      },
    [onSwitchRole, onSignOut, userEmail]
  );
  const PanneauxTab = useMemo(
    () =>
      function PanneauxTabScreen() {
        return <AgentPanneauxStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
      },
    [onSwitchRole, onSignOut, userEmail]
  );
  const ProfilTab = useMemo(
    () =>
      function ProfilTabScreen() {
        return <AgentProfileStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
      },
    [onSwitchRole, onSignOut, userEmail]
  );

  return (
    <AgentTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingTop: 4,
          paddingBottom: bottomInset - 4,
          height: 58 + bottomInset,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <AgentTab.Screen
        name="MissionsTab"
        component={MissionsTab}
        options={{
          title: "Missions",
          tabBarIcon: ({ color, size }) => tabIcon("clipboard-outline", color, size),
        }}
      />
      <AgentTab.Screen
        name="PanneauxTab"
        component={PanneauxTab}
        options={{
          title: "Panneaux",
          tabBarIcon: ({ color, size }) => tabIcon("grid-outline", color, size),
        }}
      />
      <AgentTab.Screen
        name="ProfilTab"
        component={ProfilTab}
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => tabIcon("person-outline", color, size),
        }}
      />
    </AgentTab.Navigator>
  );
}

function ReportingNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ReportingStack.Navigator
      screenOptions={{
        ...lightStackScreenOptions,
        headerRight: () => (
          <ManagerHeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />
        ),
      }}
    >
      <ReportingStack.Screen
        name={REPORTING_MODE_SCREENS.Generate}
        component={ReportingGenerateScreen}
        options={{ headerShown: false }}
        initialParams={{ reportScreens: REPORTING_MODE_SCREENS, reportingUiMode: "standalone" }}
      />
      <ReportingStack.Screen
        name={REPORTING_MODE_SCREENS.Editor}
        component={ReportingEditorScreen}
        initialParams={{ reportScreens: REPORTING_MODE_SCREENS }}
        options={{ title: "Personnaliser rapport" }}
      />
      <ReportingStack.Screen name={REPORTING_MODE_SCREENS.Preview} component={ReportingPreviewScreen} options={{ title: "Aperçu PDF" }} />
    </ReportingStack.Navigator>
  );
}

function AppContent() {
  const { loading: authLoading, session, isAuthConfigured, signOut, updateAppRole } = useAuth();
  const { isDemo, ready: demoReady, enterDemo, exitDemo, demoUserEmail } = useDemo();
  const userEmail = isDemo ? demoUserEmail : session?.user?.email || "";
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedRole = await getUserRole();
      if (storedRole === "gestionnaire" || storedRole === "agent" || storedRole === "reporting") {
        setRole(storedRole);
      } else if (storedRole === "directeur") {
        setRole("gestionnaire");
      } else if (storedRole === "employe") {
        setRole("agent");
      }
      setLoadingRole(false);
    };
    bootstrap();
  }, []);

  const handleSelectRole = async (nextRole) => {
    await clearAllSelectedProjects();
    await saveUserRole(nextRole);
    if (isAuthConfigured && typeof updateAppRole === "function" && !isDemo) {
      try {
        await updateAppRole(nextRole);
      } catch (_e) {
        // metadata optionnelle
      }
    }
    setRole(nextRole);
  };

  const handleSwitchRole = async () => {
    await clearAllSelectedProjects();
    await clearUserRole();
    setRole(null);
  };

  const handleSignOut = async () => {
    await clearAllSelectedProjects();
    await clearUserRole();
    setRole(null);
    if (isDemo) {
      await exitDemo();
    }
    if (isAuthConfigured) await signOut();
  };

  if (authLoading || !demoReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (loadingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (isAuthConfigured && !session && !isDemo) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen />
      </>
    );
  }

  if (!role) {
    return (
      <>
        <StatusBar style="dark" />
        <RoleGateScreen
          onSelectRole={handleSelectRole}
          onSignOut={isAuthConfigured || isDemo ? handleSignOut : null}
          isDemo={isDemo}
          onEnterDemo={!isAuthConfigured ? enterDemo : undefined}
        />
      </>
    );
  }

  return (
    <NavigationContainer theme={navigationLightTheme}>
      <StatusBar style="dark" />
      <RootStack.Navigator key={role}>
        {role === "gestionnaire" ? (
          <RootStack.Screen name="ModeGestionnaire" options={{ headerShown: false }}>
            {(props) => (
              <ManagerTabNavigator
                {...props}
                onSwitchRole={handleSwitchRole}
                onSignOut={isAuthConfigured || isDemo ? handleSignOut : null}
                userEmail={userEmail}
              />
            )}
          </RootStack.Screen>
        ) : role === "agent" ? (
          <RootStack.Screen name="ModeAgentTerrain" options={{ headerShown: false }}>
            {(props) => (
              <AgentTabNavigator
                {...props}
                onSwitchRole={handleSwitchRole}
                onSignOut={isAuthConfigured || isDemo ? handleSignOut : null}
                userEmail={userEmail}
              />
            )}
          </RootStack.Screen>
        ) : role === "reporting" ? (
          <RootStack.Screen name="ModeReporting" options={{ headerShown: false }}>
            {(props) => (
              <ReportingNavigator
                {...props}
                onSwitchRole={handleSwitchRole}
                onSignOut={isAuthConfigured || isDemo ? handleSignOut : null}
                userEmail={userEmail}
              />
            )}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="ModeGestionnaire" options={{ headerShown: false }}>
            {(props) => (
              <ManagerTabNavigator
                {...props}
                onSwitchRole={handleSwitchRole}
                onSignOut={isAuthConfigured || isDemo ? handleSignOut : null}
                userEmail={userEmail}
              />
            )}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });
  const shouldBlockOnFonts = Platform.OS !== "web";

  if (shouldBlockOnFonts && !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DemoProvider>
          <ToastProvider>
            <NetworkSyncProvider>
              <AppContent />
            </NetworkSyncProvider>
          </ToastProvider>
        </DemoProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
