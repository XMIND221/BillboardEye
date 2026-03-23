import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useDemo } from "../contexts/DemoContext";
import { theme } from "../theme";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, resetPassword } = useAuth();
  const { enterDemo } = useDemo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnterDemo = async () => {
    setDemoLoading(true);
    setError("");
    try {
      await enterDemo();
    } catch (e) {
      setError(e?.message || "Impossible d’ouvrir le mode démo.");
    } finally {
      setDemoLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Email et mot de passe requis.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setError("Saisissez votre email pour réinitialiser le mot de passe.");
      return;
    }
    setLoading(true);
    setError("");
    resetPassword(email.trim())
      .then(() => Alert.alert("Email envoyé", "Vérifiez votre boîte mail pour réinitialiser votre mot de passe."))
      .catch((err) => setError(err.message || "Erreur lors de l'envoi."))
      .finally(() => setLoading(false));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: Math.max(insets.top, 12) + 16 }]}>
          <View style={styles.heroInner} />
        </View>

        <View style={[styles.cardWrap, { paddingBottom: insets.bottom + 24 }]}>
          <Card variant="elevated" style={styles.card}>
            <View style={styles.brandBlock}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>BE</Text>
              </View>
              <Text style={styles.brandTitle}>BillboardEye</Text>
              <Text style={styles.brandSub}>Suivi de campagnes d'affichage</Text>
            </View>

            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Accédez à votre espace</Text>
            <Text style={styles.demoHint}>Données fictives · aucune écriture en base</Text>

            <Input
              style={styles.input}
              placeholder="nom@entreprise.fr"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Input
              style={styles.input}
              placeholder="Mot de passe"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError("");
              }}
              secureTextEntry
              autoComplete="password"
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={styles.forgotLink} onPress={handleForgotPassword} disabled={loading}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              disabled={loading || demoLoading}
              style={styles.button}
            />

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleEnterDemo}
              disabled={loading || demoLoading}
              activeOpacity={0.85}
            >
              <Text style={styles.demoButtonText}>{demoLoading ? "Ouverture…" : "Découvrir l’application (démo)"}</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    height: 128,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
  },
  heroInner: {
    flex: 1,
    opacity: 0.15,
    backgroundColor: theme.colors.primaryForeground,
    borderRadius: theme.radius.lg,
  },
  cardWrap: {
    marginTop: -56,
    paddingHorizontal: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  logoText: {
    color: theme.colors.primaryForeground,
    fontWeight: "800",
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
  },
  brandSub: {
    marginTop: 4,
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
  },
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.md,
  },
  forgotText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    marginTop: theme.spacing.sm,
  },
  demoHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    lineHeight: 16,
  },
  demoButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.muted,
  },
  demoButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.primary,
  },
});
