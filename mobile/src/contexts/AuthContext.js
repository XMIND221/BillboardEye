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

  const getToken = async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token || session?.access_token;
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut, getToken, isAuthConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}
