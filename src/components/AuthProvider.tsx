"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabaseAuth } from "@/lib/supabase-auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!supabaseAuth) {
      Promise.resolve().then(() => {
        if (mounted) setLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    supabaseAuth.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);

    if (!supabaseAuth || !isSupabaseConfigured) {
      setError("Supabase no esta configurado. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
      return;
    }

    try {
      const { error: authError } = await supabaseAuth.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/races`,
        },
      });
      if (authError) throw authError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo iniciar sesion con Google.");
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setError(null);

    if (!supabaseAuth) return;

    try {
      const { error: authError } = await supabaseAuth.auth.signOut();
      if (authError) throw authError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cerrar la sesion.");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      signOutUser,
    }),
    [error, loading, signInWithGoogle, signOutUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
