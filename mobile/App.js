import React, { useEffect, useMemo, useState } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./src/theme";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RoleGateScreen from "./src/screens/RoleGateScreen";
import ManagerDashboardScreen from "./src/screens/ManagerDashboardScreen";
import ManagerCampaignsScreen from "./src/screens/ManagerCampaignsScreen";
import ManagerCreateCampaignScreen from "./src/screens/ManagerCreateCampaignScreen";
import ManagerCampaignDetailScreen from "./src/screens/ManagerCampaignDetailScreen";
import ManagerPanneauxScreen from "./src/screens/ManagerPanneauxScreen";
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
import { clearUserRole, getUserRole, saveUserRole } from "./src/services/projectStorage";

const RootStack = createNativeStackNavigator();
const ManagerDashboardStack = createNativeStackNavigator();
const ManagerCampaignsStack = createNativeStackNavigator();
const ManagerPanneauxStack = createNativeStackNavigator();
const ManagerRapportsStack = createNativeStackNavigator();
const ManagerProfilStack = createNativeStackNavigator();
const ManagerTab = createBottomTabNavigator();
const MissionsStack = createNativeStackNavigator();
const PanneauxStack = createNativeStackNavigator();
const RapportsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ReportingStack = createNativeStackNavigator();
const AgentTab = createBottomTabNavigator();

const navigationLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.background,
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
  contentStyle: { backgroundColor: theme.colors.background },
};

function HeaderActions({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, maxWidth: 220 }}>
      {userEmail ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: 11 }} numberOfLines={1}>
          {userEmail}
        </Text>
      ) : null}
      <TouchableOpacity onPress={onSwitchRole} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 14 }}>Changer</Text>
      </TouchableOpacity>
      {onSignOut && (
        <TouchableOpacity onPress={onSignOut} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ color: theme.colors.textSecondary, fontWeight: "600", fontSize: 13 }}>Déconnexion</Text>
        </TouchableOpacity>
      )}
    </View>
  );
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
        headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />,
      }}
    >
      <ManagerCampaignsStack.Screen name="ManagerCampaigns" component={ManagerCampaignsScreen} options={{ title: "Campagnes" }} />
      <ManagerCampaignsStack.Screen name="ManagerCreateCampaign" component={ManagerCreateCampaignScreen} options={{ title: "Création campagne" }} />
      <ManagerCampaignsStack.Screen name="ManagerCampaignDetail" component={ManagerCampaignDetailScreen} options={{ title: "Détail campagne" }} />
    </ManagerCampaignsStack.Navigator>
  );
}

function ManagerPanneauxStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ManagerPanneauxStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerShown: false, headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}>
      <ManagerPanneauxStack.Screen name="ManagerPanneauxMain" component={ManagerPanneauxScreen} />
    </ManagerPanneauxStack.Navigator>
  );
}

function ManagerRapportsStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ManagerRapportsStack.Navigator
      screenOptions={{
        ...lightStackScreenOptions,
        headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />,
      }}
    >
      <ManagerRapportsStack.Screen name="ReportingGenerate" component={ReportingGenerateScreen} options={{ headerShown: false }} />
      <ManagerRapportsStack.Screen name="ReportingEditor" component={ReportingEditorScreen} options={{ title: "Édition rapport" }} />
      <ManagerRapportsStack.Screen name="ReportingPreview" component={ReportingPreviewScreen} options={{ title: "Aperçu PDF" }} />
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
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <ManagerTab.Screen
        name="ManagerDashboardTab"
        component={DashboardTab}
        options={{ title: "Tableau", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <ManagerTab.Screen
        name="ManagerCampaignsTab"
        component={CampaignsTab}
        options={{ title: "Campagnes", tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} /> }}
      />
      <ManagerTab.Screen
        name="ManagerPanneauxTab"
        component={PanneauxTab}
        options={{ title: "Panneaux", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
      />
      <ManagerTab.Screen
        name="ManagerRapportsTab"
        component={RapportsTab}
        options={{ title: "Rapports", tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} /> }}
      />
      <ManagerTab.Screen
        name="ManagerProfilTab"
        component={ProfilTab}
        options={{ title: "Profil", tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </ManagerTab.Navigator>
  );
}

function AgentMissionsStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <MissionsStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}>
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
    <PanneauxStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}>
      <PanneauxStack.Screen name="AgentPanneaux" component={AgentPanneauxScreen} options={{ headerShown: false }} />
      <PanneauxStack.Screen name="UploadPanneau" component={UploadPanneauScreen} options={{ title: "Mode upload" }} />
    </PanneauxStack.Navigator>
  );
}

function AgentRapportsStackNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <RapportsStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}>
      <RapportsStack.Screen name="ReportingGenerate" component={ReportingGenerateScreen} options={{ headerShown: false }} />
      <RapportsStack.Screen name="ReportingEditor" component={ReportingEditorScreen} options={{ title: "Édition rapport" }} />
      <RapportsStack.Screen name="ReportingPreview" component={ReportingPreviewScreen} options={{ title: "Aperçu PDF" }} />
    </RapportsStack.Navigator>
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
  const RapportsTab = useMemo(
    () =>
      function RapportsTabScreen() {
        return <AgentRapportsStackNavigator onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />;
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
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      }}
    >
      <AgentTab.Screen
        name="MissionsTab"
        component={MissionsTab}
        options={{
          title: "Missions",
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} />,
        }}
      />
      <AgentTab.Screen
        name="PanneauxTab"
        component={PanneauxTab}
        options={{
          title: "Panneaux",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <AgentTab.Screen
        name="RapportsTab"
        component={RapportsTab}
        options={{
          title: "Rapports",
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <AgentTab.Screen
        name="ProfilTab"
        component={ProfilTab}
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </AgentTab.Navigator>
  );
}

function ReportingNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ReportingStack.Navigator screenOptions={{ ...lightStackScreenOptions, headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}>
      <ReportingStack.Screen name="ReportingGenerate" component={ReportingGenerateScreen} options={{ headerShown: false }} />
      <ReportingStack.Screen name="ReportingEditor" component={ReportingEditorScreen} options={{ title: "Édition rapport" }} />
      <ReportingStack.Screen name="ReportingPreview" component={ReportingPreviewScreen} options={{ title: "Aperçu PDF" }} />
    </ReportingStack.Navigator>
  );
}

function AppContent() {
  const { loading: authLoading, session, isAuthConfigured, signOut, updateAppRole } = useAuth();
  const userEmail = session?.user?.email || "";
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
    await saveUserRole(nextRole);
    if (isAuthConfigured && typeof updateAppRole === "function") {
      try {
        await updateAppRole(nextRole);
      } catch (_e) {
        // metadata optionnelle
      }
    }
    setRole(nextRole);
  };

  const handleSwitchRole = async () => {
    await clearUserRole();
    setRole(null);
  };

  if (authLoading) {
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

  if (isAuthConfigured && !session) {
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
        <RoleGateScreen onSelectRole={handleSelectRole} onSignOut={isAuthConfigured ? signOut : null} />
      </>
    );
  }

  return (
    <NavigationContainer theme={navigationLightTheme}>
      <StatusBar style="dark" />
      <RootStack.Navigator key={role}>
        {role === "gestionnaire" ? (
          <RootStack.Screen name="ModeGestionnaire" options={{ headerShown: false }}>
            {(props) => <ManagerTabNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        ) : role === "agent" ? (
          <RootStack.Screen name="ModeAgentTerrain" options={{ headerShown: false }}>
            {(props) => <AgentTabNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        ) : role === "reporting" ? (
          <RootStack.Screen name="ModeReporting" options={{ headerShown: false }}>
            {(props) => <ReportingNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="ModeGestionnaire" options={{ headerShown: false }}>
            {(props) => <ManagerTabNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
