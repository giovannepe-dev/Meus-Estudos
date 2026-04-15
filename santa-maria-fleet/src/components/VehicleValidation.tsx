import React, { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Camera, QrCode, CheckCircle2, XCircle, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { isVehicleUuid, normalizeVehiclePlate, normalizeVehicleQrValue } from "@/lib/vehicleQr";

interface VehicleValidationProps {
  vehicles: any[];
  onValidated: (vehicleId: string) => void;
  enablePlateOcr?: boolean;
  enableQrCode?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const VehicleValidation: React.FC<VehicleValidationProps> = ({ vehicles, onValidated, enablePlateOcr = true, enableQrCode = true }) => {
  const [method, setMethod] = useState<"plate" | "qrcode" | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; vehicleId?: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanHandledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    scanHandledRef.current = false;
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // --- PLATE OCR ---
  const handlePlatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 5MB)"); return; }

    setPhotoPreview(URL.createObjectURL(file));
    setLoading(true);
    setResult(null);

    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("ocr-plate", {
        body: { image_base64: base64 },
      });
      if (error) throw error;

      if (data.success && data.plate_detected) {
        const plateClean = data.plate_detected.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const matched = vehicles.find(v => {
          const vPlate = v.placa?.toUpperCase().replace(/[^A-Z0-9]/g, "");
          return vPlate === plateClean;
        });

        if (matched) {
          setResult({ success: true, message: `✅ Placa ${data.plate_detected} confirmada — ${matched.prefixo || matched.placa}`, vehicleId: matched.id });
          toast.success(`Veículo ${matched.prefixo || matched.placa} confirmado!`);
        } else {
          setResult({ success: false, message: `❌ Placa ${data.plate_detected} não corresponde a nenhum veículo disponível.` });
          toast.error("Placa não encontrada nos veículos disponíveis.");
        }
      } else {
        setResult({ success: false, message: "❌ Não foi possível ler a placa. Tente novamente com uma foto mais nítida." });
        toast.error("Não foi possível ler a placa na foto.");
      }
    } catch (err: any) {
      console.error("Plate OCR error:", err);
      setResult({ success: false, message: "❌ Erro ao processar a foto. Tente novamente." });
      toast.error("Erro ao processar a foto da placa.");
    } finally {
      setLoading(false);
    }
  };

  // --- QR CODE SCAN ---
  const scanFrameWithJsQr = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
  };

  const startQrScan = async () => {
    setResult(null);
    setScanning(true);
    scanHandledRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = "BarcodeDetector" in window
        ? new (window as any).BarcodeDetector({ formats: ["qr_code"] })
        : null;

      scanIntervalRef.current = setInterval(async () => {
        if (scanHandledRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

        try {
          let qrValue: string | null = null;

          if (detector) {
            const barcodes = await detector.detect(videoRef.current);
            qrValue = barcodes[0]?.rawValue || null;
          }

          if (!qrValue) {
            qrValue = scanFrameWithJsQr()?.data || null;
          }

          if (qrValue) {
            scanHandledRef.current = true;
            handleQrResult(qrValue);
          }
        } catch (error) {
          const fallbackValue = scanFrameWithJsQr()?.data;
          if (fallbackValue) {
            scanHandledRef.current = true;
            handleQrResult(fallbackValue);
          }
        }
      }, 250);
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível acessar a câmera.");
      setScanning(false);
    }
  };

  const handleQrResult = async (qrValue: string) => {
    stopCamera();
    const normalizedValue = normalizeVehicleQrValue(qrValue);
    const normalizedPlate = normalizeVehiclePlate(normalizedValue);
    const matched = vehicles.find(v => v.id === normalizedValue || normalizeVehiclePlate(v.placa || "") === normalizedPlate);
    if (matched) {
      setResult({ success: true, message: `✅ QR Code confirmado — ${matched.prefixo || matched.placa}`, vehicleId: matched.id });
      toast.success(`Veículo ${matched.prefixo || matched.placa} confirmado!`);
    } else {
      const baseQuery = supabase
        .from("vehicles")
        .select("id, placa, prefixo, status, km_atual, km_ultima_revisao, alerta_revisao_km_intervalo");

      const { data: dbVehicle } = isVehicleUuid(normalizedValue)
        ? await baseQuery.eq("id", normalizedValue).maybeSingle()
        : await baseQuery.eq("placa", normalizedPlate).maybeSingle();

      if (dbVehicle) {
        const label = dbVehicle.prefixo || dbVehicle.placa;
        if (dbVehicle.status !== "disponivel") {
          const statusMap: Record<string, string> = {
            em_uso: "em uso",
            manutencao: "em manutenção",
            indisponivel: "indisponível",
          };
          const statusText = statusMap[dbVehicle.status] || dbVehicle.status;
          setResult({ success: false, message: `❌ Veículo ${label} está ${statusText}. Não pode ser retirado agora.` });
          toast.error(`Veículo ${label} está ${statusText}.`);
        } else if (dbVehicle.alerta_revisao_km_intervalo) {
          const baseKm = Number(dbVehicle.km_ultima_revisao ?? 0);
          const nextRevisionKm = baseKm + Number(dbVehicle.alerta_revisao_km_intervalo);
          const remaining = nextRevisionKm - Number(dbVehicle.km_atual);
          if (remaining <= 500) {
            setResult({ success: false, message: `❌ Veículo ${label} está próximo da revisão (${remaining} km restantes). Bloqueado para retirada.` });
            toast.error(`Veículo ${label} bloqueado por revisão.`);
          } else {
            // Vehicle exists, is available, not near revision — allow it
            setResult({ success: true, message: `✅ QR Code confirmado — ${label}`, vehicleId: dbVehicle.id });
            toast.success(`Veículo ${label} confirmado!`);
          }
        } else {
          // Vehicle exists and is available but wasn't in filtered list (e.g. booked by another) — allow it
          setResult({ success: true, message: `✅ QR Code confirmado — ${label}`, vehicleId: dbVehicle.id });
          toast.success(`Veículo ${label} confirmado!`);
        }
      } else {
        setResult({ success: false, message: "❌ QR Code não corresponde a nenhum veículo cadastrado." });
        toast.error("QR Code não reconhecido.");
      }
    }
  };

  // If only one method is enabled, auto-select it
  useEffect(() => {
    if (!method) {
      if (enablePlateOcr && !enableQrCode) setMethod("plate");
      else if (!enablePlateOcr && enableQrCode) setMethod("qrcode");
    }
  }, [enablePlateOcr, enableQrCode]);

  if (!method) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Confirme o veículo antes de prosseguir. Escolha um método:
        </p>
        <div className={`grid gap-3 ${enablePlateOcr && enableQrCode ? "grid-cols-2" : "grid-cols-1"}`}>
          {enablePlateOcr && (
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => setMethod("plate")}
            >
              <Camera className="w-8 h-8 text-primary" />
              <span className="text-xs font-medium">Foto da Placa</span>
            </Button>
          )}
          {enableQrCode && (
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => { setMethod("qrcode"); }}
            >
              <QrCode className="w-8 h-8 text-primary" />
              <span className="text-xs font-medium">QR Code</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {method === "plate" && (
        <>
          <Label>Tire uma foto da placa do veículo</Label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
            {photoPreview ? (
              <img src={photoPreview} alt="Placa" className="w-full max-h-48 object-contain rounded" />
            ) : (
              <>
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Toque para fotografar a placa</span>
              </>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePlatePhoto} />
          </label>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Lendo placa...
            </div>
          )}
        </>
      )}

      {method === "qrcode" && (
        <>
          <Label>Escaneie o QR Code do veículo</Label>
          {!scanning && !result && (
            <Button variant="outline" className="w-full h-24 flex-col gap-2" onClick={startQrScan}>
              <ScanLine className="w-8 h-8 text-primary" />
              <span className="text-sm">Abrir câmera para escanear</span>
            </Button>
          )}
          {scanning && (
            <div className="relative rounded-lg overflow-hidden border">
              <video ref={videoRef} className="w-full max-h-64 object-cover" playsInline muted />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50" />
              </div>
              <Button variant="ghost" size="sm" className="absolute bottom-2 right-2" onClick={stopCamera}>
                Cancelar
              </Button>
            </div>
          )}
        </>
      )}

      {result && (
        <div className={`p-3 rounded-lg border flex items-start gap-2 ${result.success ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"}`}>
          {result.success ? <CheckCircle2 className="w-5 h-5 text-success mt-0.5" /> : <XCircle className="w-5 h-5 text-destructive mt-0.5" />}
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => { setMethod(null); setResult(null); setPhotoPreview(""); stopCamera(); }}>
          Voltar
        </Button>
        {result?.success && result.vehicleId && (
          <Button className="flex-1" onClick={() => onValidated(result.vehicleId!)}>
            Confirmar e Prosseguir
          </Button>
        )}
        {result && !result.success && (
          <Button variant="outline" className="flex-1" onClick={() => { setResult(null); setPhotoPreview(""); }}>
            Tentar Novamente
          </Button>
        )}
      </div>
    </div>
  );
};

export default VehicleValidation;
