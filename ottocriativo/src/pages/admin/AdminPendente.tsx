import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

const AdminPendente = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <Clock className="h-16 w-16 mx-auto text-primary mb-2 animate-pulse" />
        <CardTitle className="font-display text-2xl">Aguardando Aprovação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Sua loja foi criada com sucesso e está aguardando aprovação do administrador.
        </p>
        <p className="text-muted-foreground">
          Você receberá acesso ao painel assim que sua loja for aprovada.
        </p>
        <a
          href="https://wa.me/5562998816808"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
        >
          Falar no WhatsApp
        </a>
      </CardContent>
    </Card>
  </div>
);

export default AdminPendente;
