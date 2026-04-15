import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Printer } from "lucide-react";

interface VehicleQrCodeProps {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VehicleQrCode: React.FC<VehicleQrCodeProps> = ({ vehicle, open, onOpenChange }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  if (!vehicle) return null;

  const handlePrint = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Code - ${vehicle.prefixo || vehicle.placa}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;}
      h2{margin-bottom:8px;} p{margin:4px 0;color:#666;font-size:14px;}</style></head>
      <body>
        <h2>${vehicle.prefixo || vehicle.placa}</h2>
        <p>${vehicle.marca || ""} ${vehicle.modelo || ""} • ${vehicle.placa}</p>
        ${svgData}
        <p style="margin-top:12px;font-size:11px;color:#999;">Escaneie para identificar o veículo</p>
        <script>setTimeout(()=>window.print(),300)</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const qrSize = 200;
    const padding = 24;
    const textAreaHeight = 70;
    const canvasWidth = qrSize + padding * 2;
    const canvasHeight = qrSize + padding * 2 + textAreaHeight;
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      const label = vehicle.prefixo || vehicle.placa;
      const detail = `${vehicle.marca || ""} ${vehicle.modelo || ""} • ${vehicle.placa}`.trim();
      ctx.fillStyle = "#111111";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, canvasWidth / 2, qrSize + padding + 24);
      ctx.fillStyle = "#666666";
      ctx.font = "12px sans-serif";
      ctx.fillText(detail, canvasWidth / 2, qrSize + padding + 44);
      const a = document.createElement("a");
      a.download = `qrcode-${vehicle.placa}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code — {vehicle.prefixo || vehicle.placa}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div ref={qrRef} className="p-4 bg-white rounded-lg">
            <QRCodeSVG value={vehicle.id} size={200} level="H" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {vehicle.marca} {vehicle.modelo} • {vehicle.placa}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Cole este QR Code no veículo para identificação rápida na retirada.
          </p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" /> Baixar PNG
            </Button>
            <Button className="flex-1" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleQrCode;
