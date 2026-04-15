import React, { useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

const Signup: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const empresaSlug = slug || searchParams.get("empresa") || "";
  const isJoiningCompany = !!empresaSlug;

  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!isJoiningCompany && !empresaNome.trim()) {
      toast.error("Informe o nome da empresa");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await signUp(
      email.trim(),
      password,
      nome.trim(),
      setor.trim(),
      telefone.trim(),
      empresaSlug || undefined,
      !isJoiningCompany ? empresaNome.trim() : undefined
    );
    setLoading(false);
    if (error) {
      if (error.message?.includes("Empresa não encontrada")) {
        toast.error("Link de cadastro inválido ou empresa inativa.");
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-sm shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Cadastro Enviado!
            </h1>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {isJoiningCompany
                ? "Seu pedido de cadastro foi enviado. O administrador da empresa precisará aprovar sua conta."
                : "Sua empresa e conta de administrador foram criadas. Aguarde a liberação do acesso pelo suporte."}
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🚗</span>
            </div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isJoiningCompany ? "Cadastro de Motorista" : "Cadastro de Empresa"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isJoiningCompany ? "Solicite acesso à frota" : "Crie sua conta de administrador"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isJoiningCompany && (
              <div className="space-y-2">
                <Label htmlFor="empresaNome">Nome da Empresa *</Label>
                <Input
                  id="empresaNome"
                  type="text"
                  placeholder="Ex: Transportadora ABC"
                  value={empresaNome}
                  onChange={(e) => setEmpresaNome(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input id="nome" type="text" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <Input id="setor" type="text" placeholder="Ex: Enfermagem, Administrativo..." value={setor} onChange={(e) => setSetor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">WhatsApp</Label>
              <Input id="telefone" type="tel" placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} autoComplete="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? "Enviando..." : isJoiningCompany ? "Solicitar Cadastro" : "Criar Empresa"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <button type="button" className="text-primary font-medium hover:underline" onClick={() => navigate("/login")}>
                Entrar
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
