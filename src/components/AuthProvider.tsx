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
  premiumLoading: boolean;
  isPremium: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getAppOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    try {
      const configuredOrigin = new URL(configuredUrl).origin;
      const isLocalOrigin = ["localhost", "127.0.0.1", "[::1]"].includes(
        new URL(configuredOrigin).hostname,
      );

      if (process.env.NODE_ENV !== "production" || !isLocalOrigin) {
        return configuredOrigin;
      }
    } catch {
      // Use the browser origin when the optional URL is invalid.
    }
  }

  return window.location.origin;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
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

  useEffect(() => {
    let mounted = true;

    if (!user || !supabaseAuth) {
      Promise.resolve().then(() => {
        if (!mounted) return;
        setIsPremium(false);
        setPremiumLoading(false);
      });
      return () => {
        mounted = false;
      };
    }

    Promise.resolve()
      .then(() => {
        if (mounted) setPremiumLoading(true);
        return supabaseAuth?.auth.getSession();
      })
      .then((sessionResult) =>
        fetch("/api/account/me", {
          cache: "no-store",
          headers: sessionResult?.data.session?.access_token
            ? { Authorization: `Bearer ${sessionResult.data.session.access_token}` }
            : {},
        }),
      )
      .then((response) => response.json())
      .then((profile) => {
        if (!mounted) return;
        setIsPremium(Boolean(profile?.is_premium));
      })
      .catch(() => {
        if (mounted) setIsPremium(false);
      })
      .finally(() => {
        if (mounted) setPremiumLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user]);

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
          redirectTo: `${getAppOrigin()}/races`,
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
      premiumLoading,
      isPremium,
      error,
      signInWithGoogle,
      signOutUser,
    }),
    [error, isPremium, loading, premiumLoading, signInWithGoogle, signOutUser, user],
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
