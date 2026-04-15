import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Image, File, Plus, Upload, X, Download, Trash2 } from "lucide-react";
import EsgRequirementsGuide, { evidenciasRequirements } from "@/components/EsgRequirementsGuide";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const typeIcons: Record<string, typeof FileText> = { pdf: FileText, image: Image, doc: File };
const typeColors: Record<string, "destructive" | "default" | "secondary"> = { pdf: "destructive", image: "default", doc: "secondary" };

function detectFileType(file: globalThis.File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  return "doc";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EvidenciasPage = () => {
  const { user, companyId } = useAuth();
  const [evidences, setEvidences] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [indicatorName, setIndicatorName] = useState("");
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (companyId) fetchEvidences();
    else setLoading(false);
  }, [companyId]);

  const fetchEvidences = async () => {
    const { data } = await supabase.from("evidences").select("*").eq("company_id", companyId!).order("created_at", { ascending: false });
    setEvidences(data || []);
    setLoading(false);
  };

  const handleFileSelect = (file: globalThis.File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 10 MB");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !indicatorName || !companyId || !user) {
      toast.error("Selecione um arquivo e preencha o indicador");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${companyId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("evidences")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("evidences").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("evidences").insert({
        name: selectedFile.name,
        file_type: detectFileType(selectedFile),
        file_size: formatFileSize(selectedFile.size),
        file_url: urlData.publicUrl,
        indicator_name: indicatorName,
        company_id: companyId,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;

      toast.success("Evidência enviada com sucesso!");
      setDialogOpen(false);
      setSelectedFile(null);
      setIndicatorName("");
      fetchEvidences();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (ev: any) => {
    if (!confirm("Excluir esta evidência?")) return;
    
    // Try to delete file from storage if URL exists
    if (ev.file_url) {
      const path = ev.file_url.split("/evidences/")[1];
      if (path) await supabase.storage.from("evidences").remove([decodeURIComponent(path)]);
    }

    await supabase.from("evidences").delete().eq("id", ev.id);
    toast.success("Evidência excluída");
    fetchEvidences();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Evidências</h1>
          <p className="text-muted-foreground text-sm">Documentos e evidências para auditorias ESG</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setSelectedFile(null); setIndicatorName(""); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Evidência</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Enviar Evidência</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.svg"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-primary">Clique para selecionar</span> ou arraste o arquivo aqui
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, XLS, imagens · Máx. 10 MB</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Indicador relacionado</Label>
                <Input
                  value={indicatorName}
                  onChange={(e) => setIndicatorName(e.target.value)}
                  placeholder="Ex: Consumo de Energia, Emissões CO₂"
                />
                <p className="text-xs text-muted-foreground">💡 Vincule a evidência ao indicador ESG correspondente</p>
              </div>

              <Button onClick={handleUpload} className="w-full" disabled={uploading || !selectedFile}>
                {uploading ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" /> Enviando...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Enviar Evidência</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <EsgRequirementsGuide title="Evidências" items={evidenciasRequirements} />

      {evidences.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma evidência cadastrada. Clique em "Nova Evidência" para enviar seu primeiro arquivo.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evidences.map((ev) => {
            const Icon = typeIcons[ev.file_type] || File;
            return (
              <Card key={ev.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-2 rounded-lg bg-secondary">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ev.name}</p>
                    <p className="text-xs text-muted-foreground">Indicador: {ev.indicator_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleDateString("pt-BR")} {ev.file_size && `· ${ev.file_size}`}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {ev.file_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={ev.file_url} target="_blank" rel="noopener noreferrer" title="Baixar">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(ev)} title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Badge variant={typeColors[ev.file_type] || "secondary"}>{ev.file_type.toUpperCase()}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EvidenciasPage;
