import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isAuthConfigured } from "../services/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "@billboardeye:auth_token";

const AuthContext = createContext({ session: null, loading: true, signIn: null, signOut: null });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (s?.access_token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, s.access_token);
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.access_token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, s.access_token);
      } else {
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    if (!supabase) throw new Error("Auth non configuré");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setSession(null);
  };

  const resetPassword = async (email) => {
    if (!supabase) throw new Error("Auth non configuré");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: undefined,
    });
    if (error) throw error;
  };

  const getToken = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token || session?.access_token;
  };

  /** Synchronise le rôle métier avec Supabase (JWT user_metadata.app_role) pour le filtrage API. */
  const updateAppRole = async (appRole) => {
    if (!supabase || !appRole) return { error: null };
    const { error } = await supabase.auth.updateUser({
      data: { app_role: appRole },
    });
    if (!error) {
      const {
        data: { session: next },
      } = await supabase.auth.getSession();
      setSession(next ?? null);
      if (next?.access_token) await AsyncStorage.setItem(AUTH_TOKEN_KEY, next.access_token);
    }
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, signIn, signOut, resetPassword, getToken, updateAppRole, isAuthConfigured }}
    >
      {children}
    </AuthContext.Provider>
  );
}
