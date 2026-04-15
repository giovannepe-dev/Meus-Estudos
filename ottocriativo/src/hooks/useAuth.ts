import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  async function checkRoles(u: User) {
    const [adminRes, superRes] = await Promise.all([
      supabase.rpc("has_role", { _user_id: u.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: u.id, _role: "super_admin" as const }),
    ]);

    const superAdmin = !!superRes.data;
    setIsAdmin(!!adminRes.data || superAdmin);
    setIsSuperAdmin(superAdmin);
  }

  useEffect(() => {
    let mounted = true;

    const syncAuthState = async (nextUser: User | null) => {
      if (!mounted) return;

      setUser(nextUser);

      if (!nextUser) {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        return;
      }

      try {
        await checkRoles(nextUser);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    };

    const bootstrap = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await syncAuthState(session?.user ?? null);
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setLoading(true);
      try {
        await syncAuthState(session?.user ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    void bootstrap();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, isAdmin, isSuperAdmin, signIn, signOut };
}
