import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  companyId: string | null;
  signOut: () => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  companyId: null,
  signOut: async () => {},
  refreshCompany: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Restore session from storage FIRST
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRole(session.user.id);
        refreshCompany(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for subsequent auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip the initial session event since we handle it above
      if (event === 'INITIAL_SESSION') return;

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          checkRole(session.user.id);
          refreshCompany(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setCompanyId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    setIsAdmin(!!data);
  };

  const refreshCompany = async (userId?: string) => {
    const targetUserId = userId ?? user?.id;
    if (!targetUserId) {
      setCompanyId(null);
      return;
    }

    const { data } = await supabase
      .from("companies")
      .select("id")
      .eq("created_by", targetUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setCompanyId(data?.id ?? null);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isAdmin, companyId, signOut, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
};
