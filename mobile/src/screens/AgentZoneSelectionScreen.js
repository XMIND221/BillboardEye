import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { theme } from "../theme";

export default function AgentZoneSelectionScreen({ navigation, route }) {
  const mission = route.params?.mission;
  const zones = route.params?.zones || [];
  const suggestedZone = route.params?.suggestedZone || null;

  const goExecution = (zone) => {
    navigation.navigate("AgentExecution", {
      mission,
      zone,
      zones,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selection zone</Text>
      <Text style={styles.subtitle}>Choisis une zone existante</Text>
      {!!suggestedZone && <Text style={styles.suggested}>Suggestion GPS: {suggestedZone}</Text>}

      <FlatList
        data={zones}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => goExecution(item)} activeOpacity={0.85}>
            <Text style={styles.cardText}>{item}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucune zone configuree</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md },
  title: { fontSize: 22, fontWeight: "800", color: theme.colors.text },
  subtitle: { color: theme.colors.textSecondary, marginTop: 4, marginBottom: theme.spacing.sm },
  suggested: { color: theme.colors.success, fontWeight: "700", marginBottom: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardText: { color: theme.colors.text, fontWeight: "700", fontSize: 16 },
  empty: { color: theme.colors.textMuted, marginTop: theme.spacing.lg },
});
