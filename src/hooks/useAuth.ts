import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const isBrowser = typeof window !== "undefined";

export type AppRole = "admin" | "user";

export interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isLoading: boolean;
  profile: { full_name: string | null; credits: number; preferred_language: string } | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultState: AuthState = {
  user: null,
  session: null,
  roles: [],
  isAdmin: false,
  isLoading: true,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
};

export const AuthContext = createContext<AuthState>(defaultState);

/**
 * Internal hook that manages auth state. Called ONCE inside AuthProvider.
 */
export function useAuthInternal(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string | null; credits: number; preferred_language: string } | null>(null);

  useEffect(() => {
    if (!isBrowser) {
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    const fetchUserData = async (userId: string) => {
      try {
        const [rolesResult, profileResult] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", userId),
          supabase.from("profiles").select("full_name, credits, preferred_language").eq("user_id", userId).maybeSingle(),
        ]);

        if (!isMounted) return;

        const userRoles = (rolesResult.data?.map((r) => r.role as AppRole)) ?? [];
        setRoles(userRoles);
        setIsAdmin(userRoles.includes("admin"));
        setProfile(
          profileResult.data
            ? { full_name: profileResult.data.full_name, credits: Number(profileResult.data.credits) }
            : null
        );
      } catch {
        if (!isMounted) return;
        setRoles([]);
        setIsAdmin(false);
        setProfile(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setRoles([]);
          setIsAdmin(false);
          setProfile(null);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserData(session.user.id);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("full_name, credits").eq("user_id", user.id).maybeSingle();
    if (data) {
      setProfile({ full_name: data.full_name, credits: Number(data.credits) });
    }
  }, [user]);

  return useMemo(
    () => ({ user, session, roles, isAdmin, isLoading, profile, signOut, refreshProfile }),
    [user, session, roles, isAdmin, isLoading, profile, signOut, refreshProfile]
  );
}

/**
 * Consumer hook — all components use this to access the shared auth state.
 */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
