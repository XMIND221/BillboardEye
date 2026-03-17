import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import CreatePanneauScreen from "./src/screens/CreatePanneauScreen";
import PhotosScreen from "./src/screens/PhotosScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "BillboardEye" }} />
        <Stack.Screen
          name="CreatePanneau"
          component={CreatePanneauScreen}
          options={{ title: "Creer panneau" }}
        />
        <Stack.Screen
          name="Photos"
          component={PhotosScreen}
          options={{ title: "Ajouter photos" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
