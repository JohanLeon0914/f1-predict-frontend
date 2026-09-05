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
  foundingSupporter: boolean;
  hasUnlimitedF1Access: boolean;
  isPremium: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [foundingSupporter, setFoundingSupporter] = useState(false);
  const [hasUnlimitedF1Access, setHasUnlimitedF1Access] = useState(false);
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

    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setPremiumLoading(Boolean(session?.user));
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
        setFoundingSupporter(false);
        setHasUnlimitedF1Access(false);
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
        setFoundingSupporter(Boolean(profile?.founding_supporter));
        setHasUnlimitedF1Access(Boolean(profile?.has_unlimited_f1_access));
        setIsPremium(Boolean(profile?.is_premium));
      })
      .catch(() => {
        if (!mounted) return;
        setFoundingSupporter(false);
        setHasUnlimitedF1Access(false);
        setIsPremium(false);
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
          redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}`,
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
      foundingSupporter,
      hasUnlimitedF1Access,
      isPremium,
      error,
      signInWithGoogle,
      signOutUser,
    }),
    [
      error,
      foundingSupporter,
      hasUnlimitedF1Access,
      isPremium,
      loading,
      premiumLoading,
      signInWithGoogle,
      signOutUser,
      user,
    ],
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
