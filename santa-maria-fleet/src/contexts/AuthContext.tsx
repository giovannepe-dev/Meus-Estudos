import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "frota" | "motorista";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  telefone: string | null;
  setor: string | null;
  ativo: boolean;
  company_id: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nome: string, setor?: string, telefone?: string, empresaSlug?: string, empresaNome?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data as Profile | null);
  };

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    setRole(data?.role as AppRole | null);
  };

  const fetchSuperAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    setIsSuperAdmin(!!data);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(async () => {
            await Promise.all([
              fetchProfile(session.user.id),
              fetchRole(session.user.id),
              fetchSuperAdmin(session.user.id),
            ]);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setIsSuperAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchRole(session.user.id),
          fetchSuperAdmin(session.user.id),
        ]).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    
    // Check if user is active (approved by admin)
    const { data: profileData } = await supabase
      .from("profiles")
      .select("ativo, company_id")
      .eq("user_id", data.user.id)
      .single();
    
    if (!profileData) {
      await supabase.auth.signOut();
      return { error: { message: "Perfil não encontrado. Entre em contato com o suporte." } };
    }

    if (!profileData.ativo) {
      // Check if super admin (they bypass approval)
      const { data: saData } = await supabase
        .from("super_admins")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      
      if (!saData) {
        await supabase.auth.signOut();
        return { error: { message: "Sua conta ainda não foi aprovada por um administrador." } };
      }
    }

    // Check if company is active
    if (profileData?.company_id) {
      const { data: companyData } = await supabase
        .from("companies")
        .select("ativo")
        .eq("id", profileData.company_id)
        .single();
      
      if (companyData && !companyData.ativo) {
        // Super admins bypass company block
        const { data: saData } = await supabase
          .from("super_admins")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (!saData) {
          await supabase.auth.signOut();
          return { error: { message: "O acesso da sua empresa está suspenso. Entre em contato com o suporte." } };
        }
      }
    }
    
    return { error: null };
  };

  const signUp = async (email: string, password: string, nome: string, setor?: string, telefone?: string, empresaSlug?: string, empresaNome?: string) => {
    const metadata: Record<string, any> = {
      nome,
      setor: setor || null,
      telefone: telefone || null,
    };
    if (empresaSlug) metadata.empresa_slug = empresaSlug;
    if (empresaNome) metadata.empresa_nome = empresaNome;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });

    if (error && (error.message?.includes("already registered") || (error as any).code === "user_already_exists")) {
      return { error: { message: "Este email já está cadastrado. Tente fazer login." } };
    }

    if (error) return { error };

    if (data?.user) {
      await supabase.auth.signOut();
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isSuperAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
