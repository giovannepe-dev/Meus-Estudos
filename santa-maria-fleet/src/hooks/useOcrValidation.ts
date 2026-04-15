import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type KmValidationStatus = "ok" | "alerta" | "critico" | null;

interface OcrResult {
  km_detected: number | null;
  raw_text: string;
  success: boolean;
}

interface KmValidation {
  status: KmValidationStatus;
  motivo: string | null;
  delta: number | null;
}

export function useOcrValidation() {
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [kmValidation, setKmValidation] = useState<KmValidation>({ status: null, motivo: null, delta: null });
  const [ocrConfirmed, setOcrConfirmed] = useState(false);

  const runOcr = async (file: File): Promise<OcrResult | null> => {
    setOcrLoading(true);
    setOcrResult(null);
    setOcrConfirmed(false);
    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("ocr-odometer", {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      const result: OcrResult = data;
      setOcrResult(result);
      if (result.success && result.km_detected) {
        toast.info(`OCR detectou: ${result.km_detected.toLocaleString("pt-BR")} km`);
      } else {
        toast.warning("Não foi possível ler o hodômetro na foto. Verifique o valor manualmente.");
      }
      setOcrConfirmed(true);
      return result;
    } catch (err: any) {
      console.error("OCR error:", err);
      toast.warning("OCR indisponível. Prossiga com o valor manual.");
      setOcrConfirmed(true);
      return null;
    } finally {
      setOcrLoading(false);
    }
  };

  const validateOcrVsTyped = (kmTyped: number): { match: boolean; ocrDivergence: boolean } => {
    if (!ocrResult?.success || !ocrResult.km_detected) {
      return { match: true, ocrDivergence: false };
    }
    const diff = Math.abs(kmTyped - ocrResult.km_detected);
    const tolerance = Math.max(5, ocrResult.km_detected * 0.002);
    if (diff <= tolerance) {
      setOcrConfirmed(true);
      return { match: true, ocrDivergence: false };
    }
    // Inform but don't block
    toast.warning(
      `⚠️ O valor digitado (${kmTyped.toLocaleString("pt-BR")}) difere do OCR (${ocrResult.km_detected.toLocaleString("pt-BR")}). Divergência será registrada.`
    );
    setOcrConfirmed(true);
    return { match: false, ocrDivergence: true };
  };

  const validateKmAgainstLast = (kmAtual: number, kmAnterior: number | null): KmValidation => {
    if (kmAnterior === null) {
      const v: KmValidation = { status: "ok", motivo: null, delta: null };
      setKmValidation(v);
      return v;
    }
    const delta = kmAtual - kmAnterior;
    let status: KmValidationStatus;
    let motivo: string | null = null;

    if (delta < 0) {
      status = "critico";
      motivo = "O hodômetro informado é menor que o último registro. Verifique se o valor está correto.";
    } else if (delta <= 50) {
      status = "ok";
    } else if (delta <= 200) {
      status = "alerta";
      motivo = "Diferença de " + delta + " km entre o último registro e o atual. Pode indicar um uso do veículo que não foi registrado no sistema.";
    } else {
      status = "critico";
      motivo = "Diferença muito alta de " + delta + " km em relação ao último registro. Pode indicar uso prolongado sem registro ou erro na leitura do hodômetro.";
    }

    const v: KmValidation = { status, motivo, delta };
    setKmValidation(v);

    // Inform the driver but never block
    if (status === "alerta") {
      toast.warning(`⚠️ Atenção: diferença de ${delta} km detectada. Essa divergência será registrada para análise do gestor.`);
    } else if (status === "critico") {
      toast.error(`🚨 Atenção: diferença crítica de ${delta} km detectada. Essa divergência será registrada para análise urgente.`);
    }

    return v;
  };

  const reset = () => {
    setOcrResult(null);
    setOcrConfirmed(false);
    setKmValidation({ status: null, motivo: null, delta: null });
  };

  return {
    ocrLoading,
    ocrResult,
    ocrConfirmed,
    kmValidation,
    runOcr,
    validateOcrVsTyped,
    validateKmAgainstLast,
    setOcrConfirmed,
    reset,
  };
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
