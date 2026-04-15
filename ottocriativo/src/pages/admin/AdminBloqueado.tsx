import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

const AdminBloqueado = () => (
  <div className="min-h-screen flex items-center justify-center bg-background px-4">
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-2" />
        <CardTitle className="font-display text-2xl text-destructive">Acesso Bloqueado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Seu acesso foi bloqueado por falta de pagamento.
        </p>
        <p className="text-muted-foreground">
          Entre em contato para regularizar sua situação.
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

export default AdminBloqueado;
