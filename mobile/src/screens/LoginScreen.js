import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { theme } from "../theme";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginScreen() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      <View style={styles.header}>
        <Image source={require("../../assets/logo.png")} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.tagline}>Gestion terrain professionnelle</Text>
      </View>

      <View style={styles.content}>
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Accédez à votre espace</Text>

          <Input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(""); }}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Input
            style={styles.input}
            placeholder="Mot de passe"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
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
            disabled={loading}
            style={styles.button}
          />
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDark,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    alignItems: "center",
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    marginTop: theme.spacing.sm,
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  card: {
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: 24,
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
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    marginTop: theme.spacing.sm,
  },
});
