import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyWhatsApp } from "@/utils/getCompanyWhatsApp";
import { useAutoTracking } from "@/hooks/useAutoTracking";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Camera, Pen, Check, ArrowRight, ArrowLeft, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import VehicleValidation from "@/components/VehicleValidation";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useOcrValidation, KmValidationStatus } from "@/hooks/useOcrValidation";
import { generateCheckoutReturnPdf } from "@/utils/checkoutPdf";

const KmStatusBadge: React.FC<{ status: KmValidationStatus; motivo: string | null; delta: number | null }> = ({ status, motivo, delta }) => {
  if (!status || status === "ok") return null;
  return (
    <div className={`p-3 rounded-lg border mt-2 ${status === "critico" ? "bg-destructive/10 border-destructive/30" : "bg-warning/10 border-warning/30"}`}>
      <div className="flex items-center gap-2 mb-1">
        {status === "critico" ? <ShieldAlert className="w-4 h-4 text-destructive" /> : <AlertTriangle className="w-4 h-4 text-warning" />}
        <span className={`text-sm font-semibold ${status === "critico" ? "text-destructive" : "text-warning"}`}>
          {status === "critico" ? "CRÍTICO" : "ALERTA"}
        </span>
        {delta !== null && <span className="text-xs text-muted-foreground">Δ {delta} km</span>}
      </div>
      {motivo && <p className="text-xs text-muted-foreground">{motivo}</p>}
    </div>
  );
};

const Checkout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("action") === "devolver" ? "devolver" : "retirar";
  const { user, role, profile } = useAuth();

  // Auto-track driver location when checkout is active
  const { refresh: refreshTracking } = useAutoTracking(user?.id, profile?.company_id);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Checkout
      </h1>
      <Tabs defaultValue={defaultTab}>
        <TabsList className="w-full">
          <TabsTrigger value="retirar" className="flex-1">Retirar</TabsTrigger>
          <TabsTrigger value="devolver" className="flex-1">Devolver</TabsTrigger>
        </TabsList>
        <TabsContent value="retirar">
          <CheckoutForm userId={user?.id} userRole={role} companyId={profile?.company_id} onCheckoutCreated={refreshTracking} />
        </TabsContent>
        <TabsContent value="devolver">
          <ReturnForm userId={user?.id} userRole={role} companyId={profile?.company_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ---- CHECKOUT (RETIRADA) ----
const CheckoutForm: React.FC<{ userId?: string; userRole: string | null; companyId?: string; onCheckoutCreated?: () => void }> = ({ userId, userRole, companyId, onCheckoutCreated }) => {
  const [step, setStep] = useState(1);
  const [vehicleValidated, setVehicleValidated] = useState(false);
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [motivos, setMotivos] = useState<string[]>([]);
  const [openIncidents, setOpenIncidents] = useState<any[]>([]);
  const [form, setForm] = useState({
    veiculo_id: "", motorista_id: "", motivo_uso: "", destino_rota: "",
    km_retirada: "", foto_hodometro: null as File | null, fotoPreview: "",
    assinatura: "",
  });
  const [saving, setSaving] = useState(false);
  const [ocrDetected, setOcrDetected] = useState(false);
  const [enablePlateOcr, setEnablePlateOcr] = useState(true);
  const [enableQrCode, setEnableQrCode] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const { ocrLoading, ocrResult, ocrConfirmed, kmValidation, runOcr, validateOcrVsTyped, validateKmAgainstLast, setOcrConfirmed, reset: resetOcr } = useOcrValidation();

  useEffect(() => { fetchData(); }, []);

  // Fetch open incidents when vehicle changes
  useEffect(() => {
    if (form.veiculo_id) {
      supabase
        .from("incidents")
        .select("*")
        .eq("veiculo_id", form.veiculo_id)
        .in("status", ["aberta", "em_andamento"])
        .then(({ data }) => setOpenIncidents(data || []));
    } else {
      setOpenIncidents([]);
    }
  }, [form.veiculo_id]);

  const fetchData = async () => {
    let q = supabase.from("vehicles").select("*").eq("status", "disponivel").order("prefixo");
    if (companyId) q = q.eq("company_id", companyId);
    const { data: v } = await q;
    
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const { data: todayBookings } = await supabase
      .from("vehicle_bookings")
      .select("veiculo_id, motorista_id")
      .in("status", ["agendado", "confirmado"])
      .lte("data_inicio", todayEnd.toISOString())
      .gte("data_fim", todayStart.toISOString());
    
    // Build a map: vehicle_id -> Set of motorista_ids who booked it
    const bookingsByVehicle = new Map<string, Set<string>>();
    (todayBookings || []).forEach((b: any) => {
      if (!bookingsByVehicle.has(b.veiculo_id)) bookingsByVehicle.set(b.veiculo_id, new Set());
      bookingsByVehicle.get(b.veiculo_id)!.add(b.motorista_id);
    });

    const available = (v || []).filter((veh) => {
      const bookers = bookingsByVehicle.get(veh.id);
      // Block vehicle only if it's booked by someone OTHER than the current user
      if (bookers && !bookers.has(userId || "")) return false;
      if (veh.alerta_revisao_km_intervalo) {
        const baseKm = Number(veh.km_ultima_revisao ?? 0);
        const nextRevisionKm = baseKm + Number(veh.alerta_revisao_km_intervalo);
        const remaining = nextRevisionKm - Number(veh.km_atual);
        if (remaining <= 500) return false;
      }
      return true;
    });
    setAllVehicles(available);
    if (userRole === "admin" || userRole === "frota") {
      const { data: d } = await supabase.from("profiles").select("*").eq("ativo", true);
      setDrivers(d || []);
    }
    let settingsQuery = supabase.from("settings").select("motivos_padrao, validacao_placa_ocr, validacao_qrcode");
    if (companyId) settingsQuery = settingsQuery.eq("company_id", companyId);
    const { data: s } = await settingsQuery.limit(1).maybeSingle();
    setMotivos(s?.motivos_padrao || []);
    if (s) {
      setEnablePlateOcr((s as any).validacao_placa_ocr ?? true);
      setEnableQrCode((s as any).validacao_qrcode ?? true);
    }
  };

  const handleVehicleValidated = (vehicleId: string) => {
    setForm(f => ({ ...f, veiculo_id: vehicleId }));
    setVehicleValidated(true);
    setStep(2);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)"); return; }
      setForm((f) => ({ ...f, foto_hodometro: file, fotoPreview: URL.createObjectURL(file), km_retirada: "" }));
      setOcrConfirmed(false);
      setOcrDetected(false);
      const result = await runOcr(file);
      if (result?.success && result.km_detected) {
        setForm((f) => ({ ...f, km_retirada: String(result.km_detected) }));
        setOcrDetected(true);
      } else {
        setOcrDetected(false);
        if (userRole !== "admin") {
          toast.error("Não foi possível ler o hodômetro na foto. Tente tirar outra foto mais nítida.");
        }
      }
    }
  };

  const handleValidateKm = async () => {
    const km = Number(form.km_retirada);
    if (!km) { toast.error("Digite o KM"); return; }

    // Block non-admin if OCR didn't detect KM
    if (userRole !== "admin" && !ocrDetected) {
      toast.error("Hodômetro não foi lido pela foto. Tire outra foto mais nítida.");
      return;
    }

    validateOcrVsTyped(km);

    const { data: lastCheckout } = await supabase
      .from("checkouts")
      .select("km_devolucao")
      .eq("veiculo_id", form.veiculo_id)
      .eq("status", "fechado" as any)
      .not("km_devolucao", "is", null)
      .order("data_hora_devolucao", { ascending: false })
      .limit(1)
      .single();

    const lastKm = lastCheckout ? Number(lastCheckout.km_devolucao) : null;
    const selectedVeh = allVehicles.find(v => v.id === form.veiculo_id);
    const vehicleKm = selectedVeh ? Number(selectedVeh.km_atual) : null;
    const referenceKm = lastKm ?? vehicleKm;

    validateKmAgainstLast(km, referenceKm);

    setStep(5);
  };

  // Canvas signature
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1E3A5F"; ctx.lineWidth = 2; ctx.lineCap = "round";
  };
  useEffect(() => { if (step === 5) initCanvas(); }, [step]);

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx?.beginPath(); ctx?.moveTo(x, y);
  };
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current) return; e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx?.lineTo(x, y); ctx?.stroke();
  };
  const endDraw = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) setForm((f) => ({ ...f, assinatura: canvas.toDataURL("image/png") }));
  };
  const clearSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setForm((f) => ({ ...f, assinatura: "" }));
  };

  const handleSubmit = async () => {
    const isAdmin = userRole === "admin";
    if (!form.veiculo_id || !form.motivo_uso || !form.km_retirada) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    if (!isAdmin && (!form.foto_hodometro || !form.assinatura)) {
      toast.error("Foto do hodômetro e assinatura são obrigatórios"); return;
    }
    setSaving(true);
    try {
      const kmRetirada = Number(form.km_retirada);

      let photoPublicUrl = "";
      if (form.foto_hodometro) {
        const photoPath = `hodometro/${Date.now()}_${form.foto_hodometro.name}`;
        const { error: uploadErr } = await supabase.storage.from("fleet-files").upload(photoPath, form.foto_hodometro);
        if (uploadErr) throw uploadErr;
        const { data: photoUrl } = supabase.storage.from("fleet-files").getPublicUrl(photoPath);
        photoPublicUrl = photoUrl.publicUrl;
      }

      let sigPublicUrl = "";
      if (form.assinatura) {
        const sigBlob = await fetch(form.assinatura).then((r) => r.blob());
        const sigPath = `assinaturas/${Date.now()}_retirada.png`;
        const { error: sigErr } = await supabase.storage.from("fleet-files").upload(sigPath, sigBlob);
        if (sigErr) throw sigErr;
        const { data: sigUrl } = supabase.storage.from("fleet-files").getPublicUrl(sigPath);
        sigPublicUrl = sigUrl.publicUrl;
      }

      const motoristaId = userRole === "motorista" ? userId! : form.motorista_id || userId!;

      const hasDivergence = kmValidation.status === "alerta" || kmValidation.status === "critico";

      const { data: checkoutData, error } = await supabase.from("checkouts").insert({
        veiculo_id: form.veiculo_id,
        motorista_id: motoristaId,
        criado_por_user_id: userId!,
        motivo_uso: form.motivo_uso,
        destino_rota: form.destino_rota || null,
        km_retirada: kmRetirada,
        foto_hodometro_retirada: photoPublicUrl || "admin_manual",
        assinatura_retirada: sigPublicUrl || "admin_manual",
        km_divergente: hasDivergence,
      } as any).select("id").single();
      if (error) throw error;

      // Record km divergence if detected
      if (hasDivergence && checkoutData) {
        await supabase.from("km_divergences" as any).insert({
          veiculo_id: form.veiculo_id,
          checkout_id: checkoutData.id,
          motorista_id: motoristaId,
          km_esperado: kmValidation.delta !== null ? kmRetirada - kmValidation.delta : 0,
          km_informado: kmRetirada,
          km_divergente: kmValidation.delta || 0,
          severidade: kmValidation.status,
          motivo: kmValidation.motivo,
          foto_odometro: photoPublicUrl || null,
          km_ocr: ocrResult?.km_detected || null,
        });
        const icon = kmValidation.status === "critico" ? "🚨" : "⚠️";
        toast.warning(`${icon} Divergência de ${kmValidation.delta} km registrada (${kmValidation.status?.toUpperCase()}).`);
      }

      // Update vehicle status via secure function (works for all roles)
      const { error: statusError } = await supabase.rpc("update_vehicle_status_on_checkout", {
        _vehicle_id: form.veiculo_id,
        _new_status: "em_uso",
        _km: kmRetirada,
      });
      if (statusError) throw new Error("Erro ao atualizar status do veículo: " + statusError.message);

      toast.success("Veículo retirado com sucesso!");
      onCheckoutCreated?.(); // Start GPS tracking if enabled

      // Mandatory WhatsApp notification for pickup
      const { data: driverProfile } = await supabase.from("profiles").select("nome").eq("user_id", motoristaId).single();
      const waPhone = await getCompanyWhatsApp();
      if (waPhone) {
        const veh = allVehicles.find(v => v.id === form.veiculo_id);
        const msgText = `🔑 *Retirada de Veículo*\n\n🚘 *Veículo:* ${veh?.prefixo || veh?.placa}\n🪪 *Placa:* ${veh?.placa}\n🧑‍💼 *Motorista:* ${driverProfile?.nome || "—"}\n📝 *Motivo:* ${form.motivo_uso}\n📍 *Destino:* ${form.destino_rota || "—"}\n🛣️ *Km:* ${Number(form.km_retirada).toLocaleString("pt-BR")}\n🗓️ *Data:* ${new Date().toLocaleString("pt-BR")}`;
        const msg = encodeURIComponent(msgText);
        const waLink = `https://wa.me/${waPhone.replace(/\D/g, "")}?text=${msg}`;
        window.location.href = waLink;
      } else {
        toast.error("WhatsApp da empresa não configurado! Vá em Configurações > Empresa.");
      }

      setStep(1);
      setVehicleValidated(false);
      setForm({ veiculo_id: "", motorista_id: "", motivo_uso: "", destino_rota: "", km_retirada: "", foto_hodometro: null, fotoPreview: "", assinatura: "" });
      resetOcr();
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar retirada");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Retirada — Passo {step} de 5</CardTitle>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <VehicleValidation vehicles={allVehicles} onValidated={handleVehicleValidated} enablePlateOcr={enablePlateOcr} enableQrCode={enableQrCode} />
            </>
          )}

          {step === 2 && (
            <>
              <div className="p-3 rounded-lg border border-success/30 bg-success/10 flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span className="text-sm font-medium">Veículo confirmado: {allVehicles.find(v => v.id === form.veiculo_id)?.prefixo || allVehicles.find(v => v.id === form.veiculo_id)?.placa}</span>
              </div>
              {(userRole === "admin" || userRole === "frota") && (
                <div>
                  <Label>Motorista</Label>
                  <Select value={form.motorista_id} onValueChange={(v) => setForm({ ...form, motorista_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o motorista" /></SelectTrigger>
                    <SelectContent>
                      {drivers.map((d) => (
                        <SelectItem key={d.user_id} value={d.user_id}>{d.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {openIncidents.length > 0 && (
                <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-semibold text-warning">Avarias abertas neste veículo</span>
                  </div>
                  {openIncidents.map((inc) => (
                    <div key={inc.id} className="text-xs text-muted-foreground border-t border-warning/20 pt-1">
                      <span className="font-medium">{inc.tipo}</span> ({inc.gravidade}) — {inc.descricao?.slice(0, 80)}
                      {inc.descricao?.length > 80 ? "..." : ""}
                      <Badge variant="outline" className="ml-1 text-[10px]">{inc.status}</Badge>
                    </div>
                  ))}
                  <p className="text-xs text-warning">Estas avarias já foram registradas. Não é necessário informá-las novamente.</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setStep(1); setForm(f => ({ ...f, veiculo_id: "" })); setVehicleValidated(false); }}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Trocar Veículo
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <Label>Motivo de Uso *</Label>
                <Select value={form.motivo_uso} onValueChange={(v) => setForm({ ...form, motivo_uso: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                  <SelectContent>
                    {motivos.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destino / Rota *</Label>
                <Input value={form.destino_rota} onChange={(e) => setForm({ ...form, destino_rota: e.target.value })} placeholder="Informe o destino" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button className="flex-1" onClick={() => setStep(4)} disabled={!form.motivo_uso || !form.destino_rota.trim()}>
                  Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <Label>Foto do Hodômetro {userRole !== "admin" ? "*" : "(opcional para admin)"}</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  {form.fotoPreview ? (
                    <img src={form.fotoPreview} alt="Hodômetro" className="w-full max-h-48 object-contain rounded" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Toque para tirar foto do hodômetro</span>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
                </label>
                {ocrLoading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Lendo hodômetro...
                  </div>
                )}
                {ocrResult?.success && ocrResult.km_detected && (
                  <p className="text-sm text-primary mt-1">
                    📷 OCR detectou: <strong>{ocrResult.km_detected.toLocaleString("pt-BR")} km</strong>
                  </p>
                )}
                {form.foto_hodometro && !ocrLoading && (!ocrResult?.success || !ocrResult?.km_detected) && userRole !== "admin" && (
                  <p className="text-sm text-destructive mt-1">
                    ❌ Não foi possível ler o hodômetro. Tire outra foto mais nítida.
                  </p>
                )}
                {form.foto_hodometro && !ocrLoading && (!ocrResult?.success || !ocrResult?.km_detected) && userRole === "admin" && (
                  <p className="text-sm text-warning mt-1">
                    ⚠️ OCR não detectou — admin pode preencher manualmente.
                  </p>
                )}
              </div>
              <div>
                <Label>Km Atual (Hodômetro) *{userRole !== "admin" && " (preenchido pela foto)"}</Label>
                <Input
                  type="number"
                  value={form.km_retirada}
                  onChange={(e) => {
                    if (userRole !== "admin") return;
                    setForm({ ...form, km_retirada: e.target.value });
                    setOcrConfirmed(false);
                  }}
                  readOnly={userRole !== "admin"}
                  className={userRole !== "admin" ? "bg-muted cursor-not-allowed" : ""}
                  placeholder={ocrResult?.km_detected ? `OCR: ${ocrResult.km_detected}` : "Ex: 45000"}
                />
                {userRole !== "admin" && !form.km_retirada && (
                  <p className="text-xs text-muted-foreground mt-1">Tire a foto do hodômetro para preencher automaticamente</p>
                )}
              </div>

              <KmStatusBadge status={kmValidation.status} motivo={kmValidation.motivo} delta={kmValidation.delta} />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleValidateKm}
                  disabled={!form.km_retirada || (!form.foto_hodometro && userRole !== "admin") || ocrLoading || (userRole !== "admin" && !ocrDetected)}
                >
                  {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Validar e Próximo <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div>
                <Label>Assinatura Digital {userRole !== "admin" ? "*" : "(opcional para admin)"}</Label>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <canvas ref={canvasRef} width={320} height={150} className="w-full touch-none"
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={clearSignature} className="mt-1">
                  <Pen className="w-3 h-3 mr-1" /> Limpar
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={saving || (!form.assinatura && userRole !== "admin")}>
                  <Check className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Confirmar Retirada"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

// ---- RETURN (DEVOLUÇÃO) ----
const ReturnForm: React.FC<{ userId?: string; userRole: string | null; companyId?: string }> = ({ userId, userRole, companyId }) => {
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [selectedCheckout, setSelectedCheckout] = useState<any>(null);
  const [openIncidents, setOpenIncidents] = useState<any[]>([]);
  const [form, setForm] = useState({
    km_devolucao: "", foto_hodometro: null as File | null, fotoPreview: "",
    assinatura: "", houve_avaria: false,
  });
  const [avaria, setAvaria] = useState({
    tipo: "" as string,
    gravidade: "leve" as string,
    descricao: "",
  });
  const [saving, setSaving] = useState(false);
  const [kmValidated, setKmValidated] = useState(false);
  const [ocrDetected, setOcrDetected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const { ocrLoading, ocrResult, ocrConfirmed, kmValidation, runOcr, validateOcrVsTyped, validateKmAgainstLast, setOcrConfirmed, reset: resetOcr } = useOcrValidation();

  useEffect(() => { fetchCheckouts(); }, []);

  // Fetch open incidents when checkout is selected
  useEffect(() => {
    if (selectedCheckout?.veiculo_id) {
      supabase
        .from("incidents")
        .select("*")
        .eq("veiculo_id", selectedCheckout.veiculo_id)
        .in("status", ["aberta", "em_andamento"])
        .then(({ data }) => setOpenIncidents(data || []));
    } else {
      setOpenIncidents([]);
    }
  }, [selectedCheckout]);

  const fetchCheckouts = async () => {
    let query = supabase.from("checkouts").select("*, vehicles(placa, prefixo, marca, modelo)").eq("status", "aberto");
    if (companyId) query = query.eq("company_id", companyId);
    if (userRole === "motorista") query = query.eq("motorista_id", userId!);
    const { data } = await query;
    setCheckouts(data || []);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)"); return; }
      setForm((f) => ({ ...f, foto_hodometro: file, fotoPreview: URL.createObjectURL(file), km_devolucao: "" }));
      setOcrConfirmed(false);
      setKmValidated(false);
      setOcrDetected(false);
      const result = await runOcr(file);
      if (result?.success && result.km_detected) {
        setForm((f) => ({ ...f, km_devolucao: String(result.km_detected) }));
        setOcrDetected(true);
      } else {
        setOcrDetected(false);
        if (userRole !== "admin") {
          toast.error("Não foi possível ler o hodômetro na foto. Tente tirar outra foto mais nítida.");
        }
      }
    }
  };

  const handleValidateKm = () => {
    const km = Number(form.km_devolucao);
    if (!km) { toast.error("Digite o KM"); return; }
    if (km < Number(selectedCheckout.km_retirada)) {
      toast.error("O km de devolução não pode ser menor que o km registrado na retirada (" + Number(selectedCheckout.km_retirada).toLocaleString("pt-BR") + " km)");
      return;
    }

    // Block non-admin if OCR didn't detect KM
    if (userRole !== "admin" && !ocrDetected) {
      toast.error("Hodômetro não foi lido pela foto. Tire outra foto mais nítida.");
      return;
    }

    validateOcrVsTyped(km);

    // Na devolução, apenas informar km rodados (não gerar alerta de divergência)
    const kmRodados = km - Number(selectedCheckout.km_retirada);
    if (kmRodados >= 0) {
      toast.info(`📍 Km percorridos nesta viagem: ${kmRodados.toLocaleString("pt-BR")} km`);
    }

    setKmValidated(true);
  };

  const initCanvas = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.strokeStyle = "#1E3A5F"; ctx.lineWidth = 2; ctx.lineCap = "round";
  };
  useEffect(() => { if (selectedCheckout && kmValidated) initCanvas(); }, [selectedCheckout, kmValidated]);

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx?.beginPath(); ctx?.moveTo(x, y);
  };
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current) return; e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;
    ctx?.lineTo(x, y); ctx?.stroke();
  };
  const endDraw = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) setForm((f) => ({ ...f, assinatura: canvas.toDataURL("image/png") }));
  };
  const clearSignature = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setForm((f) => ({ ...f, assinatura: "" }));
  };

  const handleReturn = async () => {
    const isAdmin = userRole === "admin";
    if (!form.km_devolucao) {
      toast.error("Preencha o KM de devolução"); return;
    }
    if (!form.assinatura) {
      toast.error("A assinatura é obrigatória para concluir a devolução"); return;
    }
    if (!isAdmin && !form.foto_hodometro) {
      toast.error("A foto do hodômetro é obrigatória"); return;
    }
    const kmDev = Number(form.km_devolucao);
    setSaving(true);
    try {
      let photoPublicUrl = "";
      if (form.foto_hodometro) {
        const photoPath = `hodometro/${Date.now()}_devolucao_${form.foto_hodometro.name}`;
        await supabase.storage.from("fleet-files").upload(photoPath, form.foto_hodometro);
        const { data: photoUrl } = supabase.storage.from("fleet-files").getPublicUrl(photoPath);
        photoPublicUrl = photoUrl.publicUrl;
      }

      let sigPublicUrl = "";
      if (form.assinatura) {
        const sigBlob = await fetch(form.assinatura).then((r) => r.blob());
        const sigPath = `assinaturas/${Date.now()}_devolucao.png`;
        await supabase.storage.from("fleet-files").upload(sigPath, sigBlob);
        const { data: sigUrl } = supabase.storage.from("fleet-files").getPublicUrl(sigPath);
        sigPublicUrl = sigUrl.publicUrl;
      }

      const kmRodado = kmDev - Number(selectedCheckout.km_retirada);

      await supabase.from("checkouts").update({
        data_hora_devolucao: new Date().toISOString(),
        km_devolucao: kmDev,
        foto_hodometro_devolucao: photoPublicUrl || null,
        assinatura_devolucao: sigPublicUrl || null,
        km_rodado: kmRodado,
        status: "fechado" as any,
      }).eq("id", selectedCheckout.id);

      // If avaria grave, set vehicle to manutencao, otherwise disponivel
      const newVehicleStatus = (form.houve_avaria && avaria.gravidade === "grave") ? "manutencao" : "disponivel";
      // Update vehicle status via secure function (works for all roles)
      const { error: statusError2 } = await supabase.rpc("update_vehicle_status_on_checkout", {
        _vehicle_id: selectedCheckout.veiculo_id,
        _new_status: newVehicleStatus,
        _km: kmDev,
      });
      if (statusError2) throw new Error("Erro ao atualizar status do veículo: " + statusError2.message);

      // Save avaria if reported
      if (form.houve_avaria && avaria.tipo && avaria.descricao.trim()) {
        await supabase.from("incidents").insert({
          veiculo_id: selectedCheckout.veiculo_id,
          checkout_id: selectedCheckout.id,
          motorista_id: selectedCheckout.motorista_id,
          registrado_por_user_id: userId!,
          tipo: avaria.tipo as any,
          gravidade: avaria.gravidade as any,
          descricao: avaria.descricao.trim(),
          veiculo_imobilizado: avaria.gravidade === "grave",
        } as any);
      }

      // Record divergence if needed
      if (kmValidation.status === "alerta" || kmValidation.status === "critico") {
        await supabase.from("km_divergences" as any).insert({
          veiculo_id: selectedCheckout.veiculo_id,
          checkout_id: selectedCheckout.id,
          motorista_id: selectedCheckout.motorista_id,
          km_esperado: Number(selectedCheckout.km_retirada),
          km_informado: kmDev,
          km_divergente: kmRodado,
          severidade: kmValidation.status,
          motivo: kmValidation.motivo,
          foto_odometro: photoPublicUrl || null,
          km_ocr: ocrResult?.km_detected || null,
        });
      }

      toast.success("Veículo devolvido com sucesso!");

      // Generate PDF report
      try {
        await generateCheckoutReturnPdf(selectedCheckout.id);
        toast.success("PDF do checkout gerado e baixado!");
      } catch {
        toast.error("Não foi possível gerar o PDF.");
      }

      // Mandatory WhatsApp notification
      const waPhone2 = await getCompanyWhatsApp();
      if (waPhone2) {
        const veh = selectedCheckout.vehicles;
        let msgText = `🏁 *Devolução de Veículo*\n\n🚘 *Veículo:* ${veh?.prefixo || veh?.placa}\n🪪 *Placa:* ${veh?.placa}\n🛣️ *Km Rodado:* ${kmRodado}\n🗓️ *Data:* ${new Date().toLocaleString("pt-BR")}`;
        if (form.houve_avaria && avaria.tipo && avaria.descricao.trim()) {
          msgText += `\n\n🚨 AVARIA REGISTRADA\nTipo: ${avaria.tipo}\nGravidade: ${avaria.gravidade.toUpperCase()}\nDescrição: ${avaria.descricao.trim()}`;
        }
        const msg = encodeURIComponent(msgText);
        const waLink = `https://wa.me/${waPhone2.replace(/\D/g, "")}?text=${msg}`;
        window.location.href = waLink;
      } else {
        toast.error("WhatsApp da empresa não configurado! Vá em Configurações > Empresa.");
      }

      setSelectedCheckout(null);
      setForm({ km_devolucao: "", foto_hodometro: null, fotoPreview: "", assinatura: "", houve_avaria: false });
      setAvaria({ tipo: "", gravidade: "leve", descricao: "" });
      setKmValidated(false);
      resetOcr();
      fetchCheckouts();
    } catch (err: any) {
      toast.error(err.message || "Erro ao devolver");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedCheckout) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Selecionar Checkout Aberto</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {checkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum checkout aberto</p>
          ) : (
            checkouts.map((c) => (
              <button key={c.id} className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors" onClick={() => setSelectedCheckout(c)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{c.vehicles?.prefixo || c.vehicles?.placa}</p>
                    <p className="text-xs text-muted-foreground">{c.motivo_uso} • Km: {Number(c.km_retirada).toLocaleString("pt-BR")}</p>
                  </div>
                  <Badge variant="outline">Aberto</Badge>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Devolução — {selectedCheckout.vehicles?.prefixo || selectedCheckout.vehicles?.placa}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Foto do Hodômetro {userRole !== "admin" ? "*" : "(opcional para admin)"}</Label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
              {form.fotoPreview ? (
                <img src={form.fotoPreview} alt="Hodômetro" className="w-full max-h-48 object-contain rounded" />
              ) : (
                <>
                  <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Toque para tirar foto do hodômetro</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            </label>
            {ocrLoading && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Lendo hodômetro...
              </div>
            )}
            {ocrResult?.success && ocrResult.km_detected && (
              <p className="text-sm text-primary mt-1">
                📷 OCR detectou: <strong>{ocrResult.km_detected.toLocaleString("pt-BR")} km</strong>
              </p>
            )}
            {form.foto_hodometro && !ocrLoading && (!ocrResult?.success || !ocrResult?.km_detected) && userRole !== "admin" && (
              <p className="text-sm text-destructive mt-1">
                ❌ Não foi possível ler o hodômetro. Tire outra foto mais nítida.
              </p>
            )}
            {form.foto_hodometro && !ocrLoading && (!ocrResult?.success || !ocrResult?.km_detected) && userRole === "admin" && (
              <p className="text-sm text-warning mt-1">
                ⚠️ OCR não detectou — admin pode preencher manualmente.
              </p>
            )}
          </div>
          <div>
            <Label>Km Devolução *{userRole !== "admin" && " (preenchido pela foto)"}</Label>
            <Input
              type="number"
              value={form.km_devolucao}
              onChange={(e) => {
                if (userRole !== "admin") return;
                setForm({ ...form, km_devolucao: e.target.value });
                setKmValidated(false);
                setOcrConfirmed(false);
              }}
              readOnly={userRole !== "admin"}
              className={userRole !== "admin" ? "bg-muted cursor-not-allowed" : ""}
              placeholder={ocrResult?.km_detected ? `OCR: ${ocrResult.km_detected}` : `Mínimo: ${selectedCheckout.km_retirada}`}
            />
            {userRole !== "admin" && !form.km_devolucao && (
              <p className="text-xs text-muted-foreground mt-1">Tire a foto do hodômetro para preencher automaticamente</p>
            )}
          </div>

          <KmStatusBadge status={kmValidation.status} motivo={kmValidation.motivo} delta={kmValidation.delta} />

          {!kmValidated && (
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleValidateKm}
              disabled={!form.km_devolucao || (!form.foto_hodometro && userRole !== "admin") || ocrLoading || (userRole !== "admin" && !ocrDetected)}
            >
              {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Validar KM
            </Button>
          )}

          {kmValidated && (
            <>
              <div>
                <Label>Assinatura Digital {userRole !== "admin" ? "*" : "(opcional para admin)"}</Label>
                <div className="border rounded-lg overflow-hidden bg-white">
                  <canvas ref={canvasRef} width={320} height={150} className="w-full touch-none"
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={clearSignature} className="mt-1">
                  <Pen className="w-3 h-3 mr-1" /> Limpar
                </Button>
              </div>

              {/* Existing open incidents */}
              {openIncidents.length > 0 && (
                <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-semibold text-warning">Avarias já registradas neste veículo</span>
                  </div>
                  {openIncidents.map((inc) => (
                    <div key={inc.id} className="text-xs text-muted-foreground border-t border-warning/20 pt-1">
                      <span className="font-medium">{inc.tipo}</span> ({inc.gravidade}) — {inc.descricao?.slice(0, 80)}
                      {inc.descricao?.length > 80 ? "..." : ""}
                      <Badge variant="outline" className="ml-1 text-[10px]">{inc.status}</Badge>
                    </div>
                  ))}
                  <p className="text-xs text-warning">Não registre novamente avarias já listadas acima.</p>
                </div>
              )}

              {/* Report new avaria */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="houve_avaria"
                    checked={form.houve_avaria}
                    onChange={(e) => setForm({ ...form, houve_avaria: e.target.checked })}
                    className="rounded border-input"
                  />
                  <Label htmlFor="houve_avaria">Houve nova avaria?</Label>
                </div>
                {form.houve_avaria && (
                  <div className="space-y-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                    <div>
                      <Label>Tipo de Avaria *</Label>
                      <Select value={avaria.tipo} onValueChange={(v) => setAvaria({ ...avaria, tipo: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arranhao">Arranhão</SelectItem>
                          <SelectItem value="amassado">Amassado</SelectItem>
                          <SelectItem value="pneu">Pneu</SelectItem>
                          <SelectItem value="mecanica">Mecânica</SelectItem>
                          <SelectItem value="eletrica">Elétrica</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gravidade</Label>
                      <Select value={avaria.gravidade} onValueChange={(v) => setAvaria({ ...avaria, gravidade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leve">Leve</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="grave">Grave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Descrição *</Label>
                      <Textarea
                        value={avaria.descricao}
                        onChange={(e) => setAvaria({ ...avaria, descricao: e.target.value })}
                        placeholder="Descreva a avaria..."
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setSelectedCheckout(null); resetOcr(); setKmValidated(false); }}>Voltar</Button>
                <Button
                  className="flex-1"
                  onClick={handleReturn}
                  disabled={saving || (!form.assinatura && userRole !== "admin") || (form.houve_avaria && (!avaria.tipo || !avaria.descricao.trim()))}
                >
                  <Check className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Confirmar Devolução"}
                </Button>
              </div>
            </>
          )}

          {!kmValidated && (
            <Button variant="outline" className="w-full" onClick={() => { setSelectedCheckout(null); resetOcr(); }}>
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>

    </>
  );
};

export default Checkout;
