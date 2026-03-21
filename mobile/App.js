import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RoleGateScreen from "./src/screens/RoleGateScreen";
import ManagerDashboardScreen from "./src/screens/ManagerDashboardScreen";
import ManagerCampaignsScreen from "./src/screens/ManagerCampaignsScreen";
import ManagerCreateCampaignScreen from "./src/screens/ManagerCreateCampaignScreen";
import ManagerCampaignDetailScreen from "./src/screens/ManagerCampaignDetailScreen";
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
import { clearUserRole, getUserRole, saveUserRole } from "./src/services/projectStorage";

const RootStack = createNativeStackNavigator();
const ManagerStack = createNativeStackNavigator();
const AgentStack = createNativeStackNavigator();
const ReportingStack = createNativeStackNavigator();

function HeaderActions({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      {userEmail ? (
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }} numberOfLines={1}>
          {userEmail}
        </Text>
      ) : null}
      <TouchableOpacity onPress={onSwitchRole} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ color: theme.colors.accent, fontWeight: "700", fontSize: 15 }}>Changer</Text>
      </TouchableOpacity>
      {onSignOut && (
        <TouchableOpacity onPress={onSignOut} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600", fontSize: 14 }}>Déconnexion</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.textOnDark,
  headerTitleStyle: { fontWeight: "700", fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: theme.colors.background },
};

function ManagerNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ManagerStack.Navigator screenOptions={screenOptions}>
      <ManagerStack.Screen
        name="ManagerDashboard"
        component={ManagerDashboardScreen}
        options={{
          title: "Dashboard",
          headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />,
        }}
      />
      <ManagerStack.Screen
        name="ManagerCampaigns"
        component={ManagerCampaignsScreen}
        options={{ title: "Campagnes", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <ManagerStack.Screen
        name="ManagerCreateCampaign"
        component={ManagerCreateCampaignScreen}
        options={{ title: "Création campagne", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <ManagerStack.Screen
        name="ManagerCampaignDetail"
        component={ManagerCampaignDetailScreen}
        options={{ title: "Détail campagne", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
    </ManagerStack.Navigator>
  );
}

function AgentNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <AgentStack.Navigator screenOptions={screenOptions}>
      <AgentStack.Screen
        name="AgentMissions"
        component={AgentMissionsScreen}
        options={{
          title: "Missions",
          headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />,
        }}
      />
      <AgentStack.Screen
        name="AgentMissionDetail"
        component={AgentMissionDetailScreen}
        options={{ title: "Détail mission", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <AgentStack.Screen
        name="AgentZoneSelection"
        component={AgentZoneSelectionScreen}
        options={{ title: "Sélection zone", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <AgentStack.Screen
        name="AgentExecution"
        component={AgentExecutionScreen}
        options={{ title: "Exécution terrain", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <AgentStack.Screen
        name="AgentMissionComplete"
        component={AgentMissionCompleteScreen}
        options={{ title: "Fin mission", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <AgentStack.Screen
        name="AgentPanneaux"
        component={AgentPanneauxScreen}
        options={{ title: "Mes panneaux", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <AgentStack.Screen
        name="UploadPanneau"
        component={UploadPanneauScreen}
        options={{ title: "Mode Upload", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
    </AgentStack.Navigator>
  );
}

function ReportingNavigator({ onSwitchRole, onSignOut, userEmail }) {
  return (
    <ReportingStack.Navigator screenOptions={screenOptions}>
      <ReportingStack.Screen
        name="ReportingGenerate"
        component={ReportingGenerateScreen}
        options={{
          title: "Générer rapport",
          headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} />,
        }}
      />
      <ReportingStack.Screen
        name="ReportingEditor"
        component={ReportingEditorScreen}
        options={{ title: "Édition rapport", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
      <ReportingStack.Screen
        name="ReportingPreview"
        component={ReportingPreviewScreen}
        options={{ title: "Aperçu PDF", headerRight: () => <HeaderActions onSwitchRole={onSwitchRole} onSignOut={onSignOut} userEmail={userEmail} /> }}
      />
    </ReportingStack.Navigator>
  );
}

function AppContent() {
  const { loading: authLoading, session, isAuthConfigured, signOut } = useAuth();
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
    setRole(nextRole);
  };

  const handleSwitchRole = async () => {
    await clearUserRole();
    setRole(null);
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.backgroundDark }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (loadingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.backgroundDark }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (isAuthConfigured && !session) {
    return (
      <>
        <StatusBar style="light" />
        <LoginScreen />
      </>
    );
  }

  if (!role) {
    return (
      <>
        <StatusBar style="light" />
        <RoleGateScreen onSelectRole={handleSelectRole} onSignOut={isAuthConfigured ? signOut : null} />
      </>
    );
  }

  const navTheme = {
    dark: true,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.primary,
      text: theme.colors.textOnDark,
      border: theme.colors.border,
      notification: theme.colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <RootStack.Navigator key={role}>
        {role === "gestionnaire" ? (
          <RootStack.Screen name="ModeGestionnaire" options={{ headerShown: false }}>
            {(props) => <ManagerNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        ) : role === "agent" ? (
          <RootStack.Screen name="ModeAgentTerrain" options={{ headerShown: false }}>
            {(props) => <AgentNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        ) : role === "reporting" ? (
          <RootStack.Screen name="ModeReporting" options={{ headerShown: false }}>
            {(props) => <ReportingNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="ModeGestionnaire" options={{ headerShown: false }}>
            {(props) => <ManagerNavigator {...props} onSwitchRole={handleSwitchRole} onSignOut={isAuthConfigured ? signOut : null} userEmail={userEmail} />}
          </RootStack.Screen>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
