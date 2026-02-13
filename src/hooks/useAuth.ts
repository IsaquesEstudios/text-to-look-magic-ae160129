import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "user";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  isLoading: boolean;
  profile: {
    full_name: string | null;
    credits: number;
  } | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    isAdmin: false,
    isLoading: true,
    profile: null,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Fetch roles and profile in parallel
          const [rolesResult, profileResult] = await Promise.all([
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id),
            supabase
              .from("profiles")
              .select("full_name, credits")
              .eq("user_id", session.user.id)
              .maybeSingle(),
          ]);

          const roles = (rolesResult.data?.map((r) => r.role as AppRole)) ?? [];

          setState({
            user: session.user,
            session,
            roles,
            isAdmin: roles.includes("admin"),
            isLoading: false,
            profile: profileResult.data
              ? {
                  full_name: profileResult.data.full_name,
                  credits: Number(profileResult.data.credits),
                }
              : null,
          });
        } else {
          setState({
            user: null,
            session: null,
            roles: [],
            isAdmin: false,
            isLoading: false,
            profile: null,
          });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setState((s) => ({ ...s, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, signOut };
}
