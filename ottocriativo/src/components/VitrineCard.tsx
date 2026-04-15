import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, ExternalLink, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";

export function VitrineCard() {
  const { tenant: contextTenant } = useTenant();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // If tenant is not resolved from URL, fetch it by owner_id
  const { data: ownedTenant } = useQuery({
    queryKey: ["owned-tenant", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("owner_id", user!.id)
        .eq("ativo", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !contextTenant && !!user?.id,
  });

  const tenant = contextTenant || ownedTenant;

  if (!tenant) return null;

  const baseUrl = window.location.origin;
  const vitrineUrl = `${baseUrl}/loja/${tenant.slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(vitrineUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Sua Vitrine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input readOnly value={vitrineUrl} className="text-xs bg-muted" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            {copied ? "Copiado!" : "Copiar Link"}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(vitrineUrl, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir Vitrine
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
