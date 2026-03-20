import React, { useEffect, useState } from "react";
import { Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { theme } from "./src/theme";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
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
import ReportingGenerateScreen from "./src/screens/ReportingGenerateScreen";
import ReportingPreviewScreen from "./src/screens/ReportingPreviewScreen";
import { clearUserRole, getUserRole, saveUserRole } from "./src/services/projectStorage";

const RootStack = createNativeStackNavigator();
const ManagerStack = createNativeStackNavigator();
const AgentStack = createNativeStackNavigator();
const ReportingStack = createNativeStackNavigator();

function HeaderSwitchRole({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={{ color: theme.colors.accent, fontWeight: "700", fontSize: 15 }}>Changer</Text>
    </TouchableOpacity>
  );
}

const screenOptions = {
  headerStyle: { backgroundColor: theme.colors.primary },
  headerTintColor: theme.colors.text,
  headerTitleStyle: { fontWeight: "700", fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: theme.colors.background },
};

function ManagerNavigator({ onSwitchRole }) {
  return (
    <ManagerStack.Navigator screenOptions={screenOptions}>
      <ManagerStack.Screen
        name="ManagerDashboard"
        component={ManagerDashboardScreen}
        options={{
          title: "Dashboard",
          headerRight: () => <HeaderSwitchRole onPress={onSwitchRole} />,
        }}
      />
      <ManagerStack.Screen name="ManagerCampaigns" component={ManagerCampaignsScreen} options={{ title: "Campagnes" }} />
      <ManagerStack.Screen
        name="ManagerCreateCampaign"
        component={ManagerCreateCampaignScreen}
        options={{ title: "Creation campagne" }}
      />
      <ManagerStack.Screen name="ManagerCampaignDetail" component={ManagerCampaignDetailScreen} options={{ title: "Detail campagne" }} />
    </ManagerStack.Navigator>
  );
}

function AgentNavigator({ onSwitchRole }) {
  return (
    <AgentStack.Navigator screenOptions={screenOptions}>
      <AgentStack.Screen
        name="AgentMissions"
        component={AgentMissionsScreen}
        options={{
          title: "Missions",
          headerRight: () => <HeaderSwitchRole onPress={onSwitchRole} />,
        }}
      />
      <AgentStack.Screen
        name="AgentMissionDetail"
        component={AgentMissionDetailScreen}
        options={{ title: "Detail mission" }}
      />
      <AgentStack.Screen
        name="AgentZoneSelection"
        component={AgentZoneSelectionScreen}
        options={{ title: "Selection zone" }}
      />
      <AgentStack.Screen
        name="AgentExecution"
        component={AgentExecutionScreen}
        options={{ title: "Execution terrain" }}
      />
      <AgentStack.Screen
        name="AgentMissionComplete"
        component={AgentMissionCompleteScreen}
        options={{ title: "Fin mission" }}
      />
      <AgentStack.Screen
        name="AgentPanneaux"
        component={AgentPanneauxScreen}
        options={{ title: "Mes panneaux" }}
      />
    </AgentStack.Navigator>
  );
}

function ReportingNavigator({ onSwitchRole }) {
  return (
    <ReportingStack.Navigator screenOptions={screenOptions}>
      <ReportingStack.Screen
        name="ReportingGenerate"
        component={ReportingGenerateScreen}
        options={{
          title: "Générer rapport",
          headerRight: () => <HeaderSwitchRole onPress={onSwitchRole} />,
        }}
      />
      <ReportingStack.Screen
        name="ReportingPreview"
        component={ReportingPreviewScreen}
        options={{ title: "Aperçu PDF" }}
      />
    </ReportingStack.Navigator>
  );
}

function AppContent() {
  const { loading: authLoading } = useAuth();
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (loadingRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (!role) {
    return (
      <>
        <StatusBar style="auto" />
        <RoleGateScreen onSelectRole={handleSelectRole} />
      </>
    );
  }

  const navTheme = {
    dark: true,
    colors: {
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.primary,
      text: theme.colors.text,
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
            {(props) => <ManagerNavigator {...props} onSwitchRole={handleSwitchRole} />}
          </RootStack.Screen>
        ) : role === "agent" ? (
          <RootStack.Screen name="ModeAgentTerrain" options={{ headerShown: false }}>
            {(props) => <AgentNavigator {...props} onSwitchRole={handleSwitchRole} />}
          </RootStack.Screen>
        ) : role === "reporting" ? (
          <RootStack.Screen name="ModeReporting" options={{ headerShown: false }}>
            {(props) => <ReportingNavigator {...props} onSwitchRole={handleSwitchRole} />}
          </RootStack.Screen>
        ) : (
          <RootStack.Screen name="ModeGestionnaire" options={{ headerShown: false }}>
            {(props) => <ManagerNavigator {...props} onSwitchRole={handleSwitchRole} />}
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
