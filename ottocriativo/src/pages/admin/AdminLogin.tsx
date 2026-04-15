import { useState } from "react";
import laserproLogo from "@/assets/laserpro-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, Link } from "react-router-dom";
import { Store, LogIn } from "lucide-react";

const AdminLogin = () => {
  const { user, isAdmin, isSuperAdmin, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user && isSuperAdmin) return <Navigate to="/super-admin" replace />;
  if (user && isAdmin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err.message);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={laserproLogo} alt="LaserPro" className="w-[150px] mx-auto mb-2" />
          <CardTitle className="font-display flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5" />
            Acessar Minha Loja
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Entre com seu e-mail e senha para gerenciar sua loja
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            {user && !isAdmin && <p className="text-sm text-destructive">Você não tem uma loja associada a este e-mail. Crie uma loja primeiro.</p>}
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ainda não tem uma loja?{" "}
              <Link to="/criar-loja" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                <Store className="h-3 w-3" />
                Criar Loja Grátis
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
