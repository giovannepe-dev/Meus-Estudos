import React, { useState, useRef, useCallback, useEffect } from 'react';
import { KJUR, KEYUTIL, stob64, hextorstr } from 'jsrsasign';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Save, Trash2, Type, QrCode, Barcode,
  Settings2, Printer, GripVertical, Copy, Layers, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Json } from '@/integrations/supabase/types';
import qz from 'qz-tray';

// Types
interface LabelElement {
  id: string;
  type: 'text' | 'variable' | 'qrcode' | 'barcode' | 'line' | 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  variable?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: string;
  rotation?: number;
}

interface LabelTemplate {
  id?: string;
  nome: string;
  largura_mm: number;
  altura_mm: number;
  elements_json: LabelElement[];
  is_default: boolean;
}

const VARIABLES = [
  { key: '{{tombo}}', label: 'Tombo' },
  { key: '{{nome_item}}', label: 'Nome do Item' },
  { key: '{{marca}}', label: 'Marca' },
  { key: '{{modelo}}', label: 'Modelo' },
  { key: '{{numero_serie}}', label: 'Nº Série' },
  { key: '{{categoria}}', label: 'Categoria' },
  { key: '{{local}}', label: 'Local' },
  { key: '{{responsavel}}', label: 'Responsável' },
  { key: '{{data_aquisicao}}', label: 'Data Aquisição' },
];

const SAMPLE_DATA: Record<string, string> = {
  '{{tombo}}': '000042',
  '{{nome_item}}': 'Monitor Dell 24"',
  '{{marca}}': 'Dell',
  '{{modelo}}': 'P2422H',
  '{{numero_serie}}': 'SN12345678',
  '{{categoria}}': 'TI',
  '{{local}}': 'Sala 101',
  '{{responsavel}}': 'João Silva',
  '{{data_aquisicao}}': '15/03/2024',
};

const MM_TO_PX = 3.78; // approx at 96dpi

const generateId = () => Math.random().toString(36).slice(2, 10);

const LabelDesigner: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [template, setTemplate] = useState<LabelTemplate>({
    nome: 'Nova Etiqueta',
    largura_mm: 80,
    altura_mm: 40,
    elements_json: [],
    is_default: false,
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | ''>('');
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [printQty, setPrintQty] = useState(1);

  // QZ Tray state
  const [qzConnected, setQzConnected] = useState(false);
  const [qzConnecting, setQzConnecting] = useState(false);
  const [qzPrinters, setQzPrinters] = useState<string[]>([]);
  const [qzSelectedPrinter, setQzSelectedPrinter] = useState<string>('');
  const [printMode, setPrintMode] = useState<'browser' | 'qztray'>('browser');

  // QZ Tray connection with timeout
  const connectQz = async () => {
    if (qzConnected) return;
    setQzConnecting(true);
    try {
      if (!qz.websocket.isActive()) {
        console.log('QZ Tray: Iniciando conexão...');
        console.log('QZ Tray: Hostname atual:', window.location.hostname);
        try {
          const connectPromise = qz.websocket.connect({ retries: 2, delay: 1 });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 15000)
          );
          await Promise.race([connectPromise, timeoutPromise]);
        } catch (secureErr: any) {
          console.error('QZ Tray: Primeira tentativa falhou:', secureErr?.message || secureErr);
          if (qz.websocket.isActive()) { try { await qz.websocket.disconnect(); } catch {} }
          console.log('QZ Tray: Tentando conexão insegura (WS)...');
          const connectPromise = qz.websocket.connect({ usingSecure: false, retries: 2, delay: 1 });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout: QZ Tray não respondeu. Verifique se o QZ Tray está aberto e tente acessar diretamente pela URL publicada (não pelo preview do Lovable).')), 30000)
          );
          await Promise.race([connectPromise, timeoutPromise]);
        }
        console.log('QZ Tray: Conectado com sucesso!');
      }
      setQzConnected(true);
      // Small delay to allow the "Action Required" dialog to resolve
      await new Promise(r => setTimeout(r, 500));
      try {
        const printers = await qz.printers.find();
        setQzPrinters(Array.isArray(printers) ? printers : [printers]);
        if (printers.length > 0) {
          setQzSelectedPrinter(Array.isArray(printers) ? printers[0] : printers);
        }
        toast({ title: 'QZ Tray conectado!', description: `${Array.isArray(printers) ? printers.length : 1} impressora(s) encontrada(s).` });
      } catch (printerErr) {
        console.error('Erro ao buscar impressoras:', printerErr);
        toast({ title: 'QZ Tray conectado!', description: 'Use o botão de atualizar para buscar impressoras.' });
      }
    } catch (err: any) {
      console.error('QZ Tray error:', err);
      try { if (qz.websocket.isActive()) await qz.websocket.disconnect(); } catch {}
      toast({
        title: 'Erro ao conectar QZ Tray',
        description: err?.message || 'Verifique se o QZ Tray está instalado e rodando.',
        variant: 'destructive',
      });
    } finally {
      setQzConnecting(false);
    }
  };

  const disconnectQz = async () => {
    try {
      if (qz.websocket.isActive()) {
        await qz.websocket.disconnect();
      }
    } catch (e) {
      // ignore
    }
    setQzConnected(false);
    setQzPrinters([]);
    setQzSelectedPrinter('');
  };

  const refreshQzPrinters = async () => {
    if (!qzConnected) return;
    try {
      const printers = await qz.printers.find();
      setQzPrinters(Array.isArray(printers) ? printers : [printers]);
      toast({ title: 'Lista atualizada!' });
    } catch {
      toast({ title: 'Erro ao buscar impressoras', variant: 'destructive' });
    }
  };

  // QZ Tray certificate for demo signing
  useEffect(() => {
    const DEMO_CERT = `-----BEGIN CERTIFICATE-----
MIIECzCCAvOgAwIBAgIGAZy/RqYtMA0GCSqGSIb3DQEBCwUAMIGiMQswCQYDVQQG
EwJVUzELMAkGA1UECAwCTlkxEjAQBgNVBAcMCUNhbmFzdG90YTEbMBkGA1UECgwS
UVogSW5kdXN0cmllcywgTExDMRswGQYDVQQLDBJRWiBJbmR1c3RyaWVzLCBMTEMx
HDAaBgkqhkiG9w0BCQEWDXN1cHBvcnRAcXouaW8xGjAYBgNVBAMMEVFaIFRyYXkg
RGVtbyBDZXJ0MB4XDTI2MDMwNDE4MzMyNFoXDTQ2MDMwNDE4MzMyNFowgaIxCzAJ
BgNVBAYTAlVTMQswCQYDVQQIDAJOWTESMBAGA1UEBwwJQ2FuYXN0b3RhMRswGQYD
VQQKDBJRWiBJbmR1c3RyaWVzLCBMTEMxGzAZBgNVBAsMElFaIEluZHVzdHJpZXMs
IExMQzEcMBoGCSqGSIb3DQEJARYNc3VwcG9ydEBxei5pbzEaMBgGA1UEAwwRUVog
VHJheSBEZW1vIENlcnQwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC+
S5ByetmgzeCTWoGAl4H4OA4MDwR2EC5YzxkZe95rr6qLXH4PpZgfPaksVPh9gQDQ
SywGRDD6uagTECPxbfNIcJSOY1wJ39xsnQqDFvGWJ/eULrlOYz2u3p3mFWfpl3JA
W3Xajf/P8MGPAxhlOsTKqaYNJ++DY2pFBP2lCjr/C98yusl25DtkaUgSQN/G+h2c
Rol0Rf6DgfIjH/Nwvm/Iy/nIVizau5WXq29UxiY6VgGdA5jh5Sn1jfMJZ4AVqgJf
GmNf4A98VsRruHAXRvbNgMq6K7PJGC0+0xH0jxPh7hjoP9SWDsGyhc9tBox7Lv6E
KCnh6yF/HN9Q57qqIRpVAgMBAAGjRTBDMBIGA1UdEwEB/wQIMAYBAf8CAQEwDgYD
VR0PAQH/BAQDAgEGMB0GA1UdDgQWBBS/fPwu311f0X7SLXsLjQt7FeOqdDANBgkq
hkiG9w0BAQsFAAOCAQEAnLkfRriEzcyrSpsWNW6ihEJzcmeV6ja28kLzkrRHZGml
zyyUdo15kLqXhlusWj0mdHBMUiEzuhwicqim3lihJeLs5U9ksCS0vtYzBeEdf504
whbCLyvntADrlCAWSt6p4K3+tzBBjWvk9EGAEKoCR+fxwLp6TdM5qn+oxA1qQ31Q
0CFem5SzTM9wLj03mye3cH+0SXOl4EftjUaTJ3A1iWRbcJ3+7Q2OWcSTJm41bdBs
+ihATsctOkyUerhOGrh/tQdSy4DY5BheIkfenLV85ms05rnOK6GbylK0BXo3gmNJ
CNpuDd9vpL8j9/SkTSqdUDLgwowJwjsy8Z55y7KA2w==
-----END CERTIFICATE-----`;

    qz.security.setCertificatePromise(function(resolve: (value: string) => void) {
      resolve(DEMO_CERT);
    });
    qz.security.setSignatureAlgorithm('SHA512');
    
    const DEMO_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC+S5ByetmgzeCT
WoGAl4H4OA4MDwR2EC5YzxkZe95rr6qLXH4PpZgfPaksVPh9gQDQSywGRDD6uagT
ECPxbfNIcJSOY1wJ39xsnQqDFvGWJ/eULrlOYz2u3p3mFWfpl3JAW3Xajf/P8MGP
AxhlOsTKqaYNJ++DY2pFBP2lCjr/C98yusl25DtkaUgSQN/G+h2cRol0Rf6DgfIj
H/Nwvm/Iy/nIVizau5WXq29UxiY6VgGdA5jh5Sn1jfMJZ4AVqgJfGmNf4A98VsRr
uHAXRvbNgMq6K7PJGC0+0xH0jxPh7hjoP9SWDsGyhc9tBox7Lv6EKCnh6yF/HN9Q
57qqIRpVAgMBAAECggEAA1hQsbJ3INx9lhmBLUF8h2B03sFk0q52IhmB13DV+A6e
cNSvYpcGlYX/80eLFqmt2ft4SqPoOIAK9ErUVuoX3K4d7mLQu1u0BDS+eo9sr7cE
IxavKzGTY/+FxwWZTgHbgEYbTDwywvT4cgsb4qulyeoxgQmyrByTQaNU0hHb95+2
BLs1wascgrLGHW91aLNCOMqm5bIJDJ7Z3PchKEFK8T0zTJOnuBPMEqImoJPZVxYP
spZ1dbO4IMfNO6sQOFrHz09GZWmniQa6u39K7c+Aa4CJ5ziU8HfO91ybY43Qnhto
5jjLBAMyit7oU3imZ7mu3jCzV7iclwuXM2QSxTbWAQKBgQDtxXcZacQR5IRzbZMG
4M9MvtEhE21C13jGOv2P77gjTS75sC3ItI0qJXAhLzfMQRE7oUw3drYAYcok0laO
KAoyVCXzqtJZyVxQDEWEwgAbfKwcF7u8taDS4sLwp3rtBnypTe2v9ENkSHFgWVp2
w17K8HRZntO9cYQ6WLOAOTup9wKBgQDM4lMihdJYNWLfQ3DFTuhjhUOy98AfhrmC
K3gjpAkkzyMaXbk24BENkqBbwzpep5+11srs8EFsIgCw/+Oi8kpxWyiAcXycNutl
p+NE3aAjiYG0BXDRgmlBp7ahQ+wdGMU2WfHeOxSTLVAq/h85MK68fncHR4vEIRyW
+UEU0lErEwKBgBUDfqMgVdO+/nW1GWliNO/zbUgfD2j44hOi4wX1ibCVAbHPgDxc
uJ0g8ef85FGI7pz2hGXid/NQsSzP6hZmM4B/L1t5nV2SDjaE3x/8hUXons1cy5rB
8pSwtcnPA24vRJUx7e+/BrW2MU7ylqwoWBhXZ/EDuHLltWnyrOqIJF3BAoGAfaWC
dFZ7I8tBokfanbYBgB7W4KddNDhMBc8gs0LCtMcu8NlvX37UFm3IV94HKstDf6GE
+v9wL58+q02STXinPJM56GMwlyB7BfGKx83eikymtT7s7B88652tu4JLB6EMOIO6
d53lxUhxtJv5i/oV/tTTrCwtQ49G2DNtvRYp3u8CgYBr2LjKDLa/680j8AUDeX46
DoMfXv7A6Yt+Tdguz7VyX49/czSaJJkz+lrWnuZZcp3sdHBSf0WRudODSxdi+Qzc
/UmWdufYqszIxqifyp8mr0k+9W00x7XwwJ2mI2UhEKabupte4Avwhva6O5M0mq6Q
T/h/6mg1UgjeA3CqegTB2A==
-----END PRIVATE KEY-----`;

    qz.security.setSignaturePromise(function(toSign: string) {
      return function(resolve: (value: string) => void) {
        try {
          const pk = KEYUTIL.getKey(DEMO_KEY);
          const sig = new KJUR.crypto.Signature({ alg: 'SHA512withRSA' });
          sig.init(pk);
          sig.updateString(toSign);
          const hex = sig.sign();
          resolve(stob64(hextorstr(hex)));
        } catch (err) {
          console.error('QZ signing error:', err);
          resolve('');
        }
      };
    });
    return () => {
      if (qz.websocket.isActive()) {
        qz.websocket.disconnect().catch(() => {});
      }
    };
  }, []);

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['label-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('label_templates').select('*').order('nome');
      return data || [];
    },
  });

  // Fetch printer profiles
  const { data: printerProfiles } = useQuery({
    queryKey: ['printer-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('printer_profiles').select('*').order('nome');
      return data || [];
    },
  });

  const [printerForm, setPrinterForm] = useState({
    nome: '',
    largura_mm: 80,
    altura_mm: 40,
    margem_top_mm: 2,
    margem_right_mm: 2,
    margem_bottom_mm: 2,
    margem_left_mm: 2,
    orientacao: 'portrait',
    tipo_impressao: 'termica',
    escala: 100,
    is_default: false,
  });

  // Load template
  const loadTemplate = (id: string) => {
    const t = templates?.find(t => t.id === id);
    if (!t) return;
    setTemplate({
      id: t.id,
      nome: t.nome,
      largura_mm: t.largura_mm,
      altura_mm: t.altura_mm,
      elements_json: (t.elements_json as unknown as LabelElement[]) || [],
      is_default: t.is_default,
    });
    setSelectedTemplateId(id);
    setSelectedElement(null);
  };

  // Save template
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome: template.nome,
        largura_mm: template.largura_mm,
        altura_mm: template.altura_mm,
        elements_json: template.elements_json as unknown as Json,
        is_default: template.is_default,
      };
      if (template.id) {
        const { error } = await supabase.from('label_templates').update(payload).eq('id', template.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('label_templates').insert(payload).select().single();
        if (error) throw error;
        setTemplate(prev => ({ ...prev, id: data.id }));
        setSelectedTemplateId(data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-templates'] });
      toast({ title: 'Template salvo!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!template.id) return;
      const { error } = await supabase.from('label_templates').delete().eq('id', template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-templates'] });
      setTemplate({ nome: 'Nova Etiqueta', largura_mm: 80, altura_mm: 40, elements_json: [], is_default: false });
      setSelectedTemplateId('');
      toast({ title: 'Template excluído!' });
    },
  });

  const savePrinterMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('printer_profiles').insert({
        ...printerForm,
        escala: printerForm.escala / 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printer-profiles'] });
      setPrinterDialogOpen(false);
      toast({ title: 'Perfil de impressora salvo!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  // Canvas dimensions in px
  const canvasW = template.largura_mm * MM_TO_PX;
  const canvasH = template.altura_mm * MM_TO_PX;

  // Add element
  const addElement = (type: LabelElement['type']) => {
    const el: LabelElement = {
      id: generateId(),
      type,
      x: 10,
      y: 10,
      width: type === 'qrcode' ? 60 : type === 'barcode' ? 120 : type === 'line' ? 100 : type === 'rect' ? 80 : 100,
      height: type === 'qrcode' ? 60 : type === 'barcode' ? 40 : type === 'line' ? 2 : type === 'rect' ? 40 : 20,
      content: type === 'text' ? 'Texto' : undefined,
      variable: type === 'variable' ? '{{tombo}}' : type === 'qrcode' || type === 'barcode' ? '{{tombo}}' : undefined,
      fontSize: 12,
      fontWeight: 'normal',
      textAlign: 'left',
      rotation: 0,
    };
    setTemplate(prev => ({ ...prev, elements_json: [...prev.elements_json, el] }));
    setSelectedElement(el.id);
  };

  const updateElement = (id: string, updates: Partial<LabelElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements_json: prev.elements_json.map(el => el.id === id ? { ...el, ...updates } : el),
    }));
  };

  const removeElement = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      elements_json: prev.elements_json.filter(el => el.id !== id),
    }));
    if (selectedElement === id) setSelectedElement(null);
  };

  const duplicateElement = (id: string) => {
    const el = template.elements_json.find(e => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: generateId(), x: el.x + 10, y: el.y + 10 };
    setTemplate(prev => ({ ...prev, elements_json: [...prev.elements_json, newEl] }));
    setSelectedElement(newEl.id);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = template.elements_json.find(el => el.id === id);
    if (!el || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setDragging({
      id,
      offsetX: e.clientX - rect.left - el.x,
      offsetY: e.clientY - rect.top - el.y,
    });
    setSelectedElement(id);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvasW - 10, e.clientX - rect.left - dragging.offsetX));
    const y = Math.max(0, Math.min(canvasH - 10, e.clientY - rect.top - dragging.offsetY));
    updateElement(dragging.id, { x: Math.round(x), y: Math.round(y) });
  }, [dragging, canvasW, canvasH]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const resolveContent = (el: LabelElement) => {
    if (el.variable) return SAMPLE_DATA[el.variable] || el.variable;
    return el.content || '';
  };

  const selectedEl = template.elements_json.find(e => e.id === selectedElement);

  // Print via browser dialog
  const handleBrowserPrint = () => {
    const profile = selectedPrinterId && selectedPrinterId !== 'system'
      ? printerProfiles?.find(p => p.id === selectedPrinterId)
      : null;

    const scale = profile ? (profile.escala || 1) : 1;
    const marginTop = profile ? profile.margem_top_mm : 2;
    const marginRight = profile ? profile.margem_right_mm : 2;
    const marginBottom = profile ? profile.margem_bottom_mm : 2;
    const marginLeft = profile ? profile.margem_left_mm : 2;
    const pageW = profile ? profile.largura_mm : template.largura_mm + 10;
    const pageH = profile ? profile.altura_mm : template.altura_mm + 10;
    const orientation = profile?.orientacao === 'landscape' ? 'landscape' : 'portrait';

    const labelHtml = buildLabelHtml();
    const labels = Array.from({ length: printQty }, () => `
      <div style="position:relative;width:${canvasW}px;height:${canvasH}px;transform:scale(${scale});transform-origin:top left;page-break-after:always;overflow:hidden;">
        ${labelHtml}
      </div>
    `).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Erro', description: 'Bloqueador de pop-ups ativo.', variant: 'destructive' });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Etiqueta - ${template.nome}</title>
      <style>
        @page { size: ${pageW}mm ${pageH}mm ${orientation}; margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head>
      <body>${labels}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  // Build label HTML (shared)
  const buildLabelHtml = () => {
    let html = '';
    template.elements_json.forEach(el => {
      const content = resolveContent(el);
      const style = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;${el.rotation ? `transform:rotate(${el.rotation}deg);` : ''}`;
      if (el.type === 'text' || el.type === 'variable') {
        html += `<div style="${style}font-size:${el.fontSize}px;font-weight:${el.fontWeight};text-align:${el.textAlign};overflow:hidden;white-space:nowrap;line-height:${el.height}px;">${content}</div>`;
      } else if (el.type === 'qrcode') {
        html += `<div style="${style}display:flex;align-items:center;justify-content:center;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=${Math.min(el.width, el.height)}x${Math.min(el.width, el.height)}&data=${encodeURIComponent(content)}" style="max-width:100%;max-height:100%;" /></div>`;
      } else if (el.type === 'barcode') {
        html += `<div style="${style}display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:8px;text-align:center;">${content}<br/>|||||||||||||||</div>`;
      } else if (el.type === 'line') {
        html += `<div style="${style}border-top:2px solid #000;"></div>`;
      } else if (el.type === 'rect') {
        html += `<div style="${style}border:1px solid #000;"></div>`;
      }
    });
    return html;
  };

  // Print via QZ Tray (direct, no dialog)
  const handleQzPrint = async () => {
    if (!qzConnected || !qzSelectedPrinter) {
      toast({ title: 'Erro', description: 'Conecte ao QZ Tray e selecione uma impressora.', variant: 'destructive' });
      return;
    }

    try {
      const profile = selectedPrinterId && selectedPrinterId !== 'system'
        ? printerProfiles?.find(p => p.id === selectedPrinterId)
        : null;

      const scale = profile ? (profile.escala || 1) : 1;
      const marginTop = profile ? profile.margem_top_mm : 2;
      const marginRight = profile ? profile.margem_right_mm : 2;
      const marginBottom = profile ? profile.margem_bottom_mm : 2;
      const marginLeft = profile ? profile.margem_left_mm : 2;
      const pageW = profile ? profile.largura_mm : template.largura_mm + 10;
      const pageH = profile ? profile.altura_mm : template.altura_mm + 10;
      const orientation = profile?.orientacao === 'landscape' ? 'landscape' : 'portrait';

      const labelHtml = buildLabelHtml();
      const singleLabel = `
        <html><head>
        <style>
          @page { size: ${pageW}mm ${pageH}mm ${orientation}; margin: ${marginTop}mm ${marginRight}mm ${marginBottom}mm ${marginLeft}mm; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; color: #000; }
        </style></head>
        <body>
          <div style="position:relative;width:${canvasW}px;height:${canvasH}px;transform:scale(${scale});transform-origin:top left;overflow:hidden;">
            ${labelHtml}
          </div>
        </body></html>
      `;

      const config = qz.configs.create(qzSelectedPrinter, {
        size: { width: pageW / 25.4, height: pageH / 25.4 }, // convert mm to inches
        margins: { top: marginTop / 25.4, right: marginRight / 25.4, bottom: marginBottom / 25.4, left: marginLeft / 25.4 },
        orientation,
        copies: printQty,
      });

      const data = [{ type: 'html', format: 'plain', data: singleLabel }];

      await qz.print(config, data);
      toast({ title: 'Impressão enviada!', description: `${printQty} etiqueta(s) enviada(s) para ${qzSelectedPrinter}.` });
    } catch (err: any) {
      console.error('QZ Print error:', err);
      toast({ title: 'Erro na impressão', description: err?.message || 'Erro ao enviar para impressora.', variant: 'destructive' });
    }
  };

  const handlePrint = () => {
    if (printMode === 'qztray') {
      handleQzPrint();
    } else {
      handleBrowserPrint();
    }
  };

  const renderElement = (el: LabelElement) => {
    const isSelected = selectedElement === el.id;
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: el.x,
      top: el.y,
      width: el.width,
      height: el.height,
      cursor: 'move',
      outline: isSelected ? '2px solid hsl(var(--primary))' : '1px dashed hsl(var(--border))',
      outlineOffset: 1,
      transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    };

    switch (el.type) {
      case 'text':
      case 'variable':
        return (
          <div
            key={el.id}
            style={{
              ...baseStyle,
              fontSize: el.fontSize,
              fontWeight: el.fontWeight,
              textAlign: el.textAlign as any,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              lineHeight: `${el.height}px`,
            }}
            onMouseDown={e => handleMouseDown(e, el.id)}
            className="select-none text-foreground"
          >
            {resolveContent(el)}
          </div>
        );
      case 'qrcode':
        return (
          <div key={el.id} style={baseStyle} onMouseDown={e => handleMouseDown(e, el.id)} className="flex items-center justify-center bg-background">
            <QRCodeSVG value={resolveContent(el)} size={Math.min(el.width, el.height) - 4} level="M" />
          </div>
        );
      case 'barcode':
        return (
          <div key={el.id} style={baseStyle} onMouseDown={e => handleMouseDown(e, el.id)} className="flex items-center justify-center bg-background">
            <div className="text-[8px] text-center font-mono">{resolveContent(el)}<br /><span className="text-muted-foreground">|||||||||||</span></div>
          </div>
        );
      case 'line':
        return (
          <div key={el.id} style={{ ...baseStyle, borderTop: '2px solid currentColor' }} onMouseDown={e => handleMouseDown(e, el.id)} className="text-foreground" />
        );
      case 'rect':
        return (
          <div key={el.id} style={{ ...baseStyle, border: '1px solid currentColor' }} onMouseDown={e => handleMouseDown(e, el.id)} className="text-foreground" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedTemplateId} onValueChange={loadTemplate}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Selecione um template" />
          </SelectTrigger>
          <SelectContent>
            {templates?.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.nome}{t.is_default ? ' ⭐' : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => {
          setTemplate({ nome: 'Nova Etiqueta', largura_mm: 80, altura_mm: 40, elements_json: [], is_default: false });
          setSelectedTemplateId('');
          setSelectedElement(null);
        }}>
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
        {template.id && (
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
        )}
        <Dialog open={printerDialogOpen} onOpenChange={setPrinterDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-1" /> Impressoras</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Perfis de Impressora</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {printerProfiles && printerProfiles.length > 0 && (
                <div className="space-y-1 mb-3">
                  {printerProfiles.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>{p.nome} ({p.largura_mm}×{p.altura_mm}mm)</span>
                      <Badge variant="outline">{p.tipo_impressao}</Badge>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <p className="text-sm font-semibold">Novo perfil</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input value={printerForm.nome} onChange={e => setPrinterForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Zebra ZD220" />
                </div>
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select value={printerForm.tipo_impressao} onValueChange={v => setPrinterForm(f => ({ ...f, tipo_impressao: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="termica">Térmica</SelectItem>
                      <SelectItem value="jato_tinta">Jato de Tinta</SelectItem>
                      <SelectItem value="laser">Laser</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Largura (mm)</Label>
                  <Input type="number" value={printerForm.largura_mm} onChange={e => setPrinterForm(f => ({ ...f, largura_mm: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Altura (mm)</Label>
                  <Input type="number" value={printerForm.altura_mm} onChange={e => setPrinterForm(f => ({ ...f, altura_mm: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Margem Sup.</Label>
                  <Input type="number" value={printerForm.margem_top_mm} onChange={e => setPrinterForm(f => ({ ...f, margem_top_mm: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Margem Inf.</Label>
                  <Input type="number" value={printerForm.margem_bottom_mm} onChange={e => setPrinterForm(f => ({ ...f, margem_bottom_mm: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Margem Esq.</Label>
                  <Input type="number" value={printerForm.margem_left_mm} onChange={e => setPrinterForm(f => ({ ...f, margem_left_mm: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Margem Dir.</Label>
                  <Input type="number" value={printerForm.margem_right_mm} onChange={e => setPrinterForm(f => ({ ...f, margem_right_mm: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Escala (%)</Label>
                  <Input type="number" value={printerForm.escala} onChange={e => setPrinterForm(f => ({ ...f, escala: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Orientação</Label>
                  <Select value={printerForm.orientacao} onValueChange={v => setPrinterForm(f => ({ ...f, orientacao: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Retrato</SelectItem>
                      <SelectItem value="landscape">Paisagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => savePrinterMutation.mutate()} disabled={!printerForm.nome || savePrinterMutation.isPending}>
                <Save className="h-4 w-4 mr-1" /> Salvar Perfil
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* Canvas area */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-sm mr-2">Canvas</CardTitle>
              <Input
                value={template.nome}
                onChange={e => setTemplate(prev => ({ ...prev, nome: e.target.value }))}
                className="h-8 w-40 text-sm"
                placeholder="Nome do template"
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Input
                  type="number" min={20} max={300}
                  value={template.largura_mm}
                  onChange={e => setTemplate(prev => ({ ...prev, largura_mm: +e.target.value }))}
                  className="h-7 w-16 text-xs"
                /> × <Input
                  type="number" min={10} max={200}
                  value={template.altura_mm}
                  onChange={e => setTemplate(prev => ({ ...prev, altura_mm: +e.target.value }))}
                  className="h-7 w-16 text-xs"
                /> mm
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 mb-3">
              <Button variant="outline" size="sm" onClick={() => addElement('text')}><Type className="h-3 w-3 mr-1" />Texto</Button>
              <Button variant="outline" size="sm" onClick={() => addElement('variable')}><span className="mr-1 font-mono text-xs">{'{}'}</span>Variável</Button>
              <Button variant="outline" size="sm" onClick={() => addElement('qrcode')}><QrCode className="h-3 w-3 mr-1" />QR Code</Button>
              <Button variant="outline" size="sm" onClick={() => addElement('barcode')}><Barcode className="h-3 w-3 mr-1" />Código Barras</Button>
              <Button variant="outline" size="sm" onClick={() => addElement('line')}>— Linha</Button>
              <Button variant="outline" size="sm" onClick={() => addElement('rect')}>☐ Retângulo</Button>
            </div>

            {/* Canvas */}
            <div className="overflow-auto rounded-lg border bg-muted/30 p-4">
              <div
                ref={canvasRef}
                className="relative bg-background border border-border shadow-sm mx-auto"
                style={{ width: canvasW, height: canvasH }}
                onClick={() => setSelectedElement(null)}
              >
                {/* Grid dots */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <defs>
                    <pattern id="grid" width="18.9" height="18.9" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r="0.5" fill="currentColor" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {template.elements_json.map(renderElement)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {template.largura_mm} × {template.altura_mm} mm — Arraste os elementos para posicionar
            </p>

            {/* Print Integration */}
            <Card className="mt-4 border-dashed">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-1"><Printer className="h-4 w-4" /> Impressão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {/* Print Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={printMode === 'browser' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPrintMode('browser')}
                    className="flex-1"
                  >
                    Navegador (com diálogo)
                  </Button>
                  <Button
                    variant={printMode === 'qztray' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPrintMode('qztray')}
                    className="flex-1"
                  >
                    QZ Tray (impressão direta)
                  </Button>
                </div>

                {/* QZ Tray connection panel */}
                {printMode === 'qztray' && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        {qzConnected ? (
                          <><Wifi className="h-4 w-4 text-primary" /><span className="text-primary font-medium">QZ Tray conectado</span></>
                        ) : (
                          <><WifiOff className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">QZ Tray desconectado</span></>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {qzConnected ? (
                          <>
                            <Button variant="outline" size="sm" onClick={refreshQzPrinters}>
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={disconnectQz}>Desconectar</Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={connectQz} disabled={qzConnecting}>
                            {qzConnecting ? 'Conectando...' : 'Conectar QZ Tray'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {qzConnected && qzPrinters.length > 0 && (
                      <div>
                        <Label className="text-xs">Impressora</Label>
                        <Select value={qzSelectedPrinter} onValueChange={setQzSelectedPrinter}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione a impressora" />
                          </SelectTrigger>
                          <SelectContent>
                            {qzPrinters.map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {!qzConnected && (
                      <p className="text-xs text-muted-foreground">
                        Instale o <a href="https://qz.io/download/" target="_blank" rel="noopener noreferrer" className="text-primary underline">QZ Tray</a> no computador e mantenha-o aberto para impressão direta sem diálogo.
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Perfil de Impressora</Label>
                    <Select value={selectedPrinterId} onValueChange={setSelectedPrinterId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Padrão do Sistema</SelectItem>
                        {printerProfiles?.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nome} ({p.largura_mm}×{p.altura_mm}mm)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={printQty}
                      onChange={e => setPrintQty(Math.max(1, +e.target.value))}
                      className="h-9"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full gap-1"
                      onClick={() => handlePrint()}
                      disabled={template.elements_json.length === 0 || (printMode === 'qztray' && (!qzConnected || !qzSelectedPrinter))}
                    >
                      <Printer className="h-4 w-4" />
                      {printMode === 'qztray' ? 'Imprimir Direto' : 'Imprimir Etiqueta'}
                    </Button>
                  </div>
                </div>
                {selectedPrinterId && selectedPrinterId !== 'system' && (() => {
                  const profile = printerProfiles?.find(p => p.id === selectedPrinterId);
                  return profile ? (
                    <div className="rounded border bg-muted/50 p-3 text-xs space-y-1">
                      <p className="font-semibold">{profile.nome}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-muted-foreground">
                        <span>Tipo: <span className="text-foreground">{profile.tipo_impressao}</span></span>
                        <span>Tamanho: <span className="text-foreground">{profile.largura_mm}×{profile.altura_mm}mm</span></span>
                        <span>Orientação: <span className="text-foreground">{profile.orientacao}</span></span>
                        <span>Escala: <span className="text-foreground">{((profile.escala || 1) * 100).toFixed(0)}%</span></span>
                        <span>Margem Sup: <span className="text-foreground">{profile.margem_top_mm}mm</span></span>
                        <span>Margem Inf: <span className="text-foreground">{profile.margem_bottom_mm}mm</span></span>
                        <span>Margem Esq: <span className="text-foreground">{profile.margem_left_mm}mm</span></span>
                        <span>Margem Dir: <span className="text-foreground">{profile.margem_right_mm}mm</span></span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Properties panel */}
        <div className="space-y-4">
          {/* Element list */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-1"><Layers className="h-4 w-4" /> Elementos ({template.elements_json.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1 max-h-40 overflow-y-auto">
              {template.elements_json.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">Adicione elementos usando a barra acima</p>
              )}
              {template.elements_json.map(el => (
                <button
                  key={el.id}
                  onClick={() => setSelectedElement(el.id)}
                  className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-left transition-colors ${
                    selectedElement === el.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">
                    {el.type === 'text' ? `"${el.content}"` :
                     el.type === 'variable' ? el.variable :
                     el.type === 'qrcode' ? 'QR Code' :
                     el.type === 'barcode' ? 'Cód. Barras' :
                     el.type === 'line' ? 'Linha' : 'Retângulo'}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Properties */}
          {selectedEl && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-1"><Settings2 className="h-4 w-4" /> Propriedades</CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                {(selectedEl.type === 'text') && (
                  <div>
                    <Label className="text-xs">Conteúdo</Label>
                    <Input value={selectedEl.content || ''} onChange={e => updateElement(selectedEl.id, { content: e.target.value })} className="h-8 text-xs" />
                  </div>
                )}
                {(selectedEl.type === 'variable' || selectedEl.type === 'qrcode' || selectedEl.type === 'barcode') && (
                  <div>
                    <Label className="text-xs">Variável</Label>
                    <Select value={selectedEl.variable || ''} onValueChange={v => updateElement(selectedEl.id, { variable: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {VARIABLES.map(v => (
                          <SelectItem key={v.key} value={v.key}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X (px)</Label>
                    <Input type="number" value={selectedEl.x} onChange={e => updateElement(selectedEl.id, { x: +e.target.value })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Y (px)</Label>
                    <Input type="number" value={selectedEl.y} onChange={e => updateElement(selectedEl.id, { y: +e.target.value })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Largura</Label>
                    <Input type="number" value={selectedEl.width} onChange={e => updateElement(selectedEl.id, { width: +e.target.value })} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Altura</Label>
                    <Input type="number" value={selectedEl.height} onChange={e => updateElement(selectedEl.id, { height: +e.target.value })} className="h-7 text-xs" />
                  </div>
                </div>
                {(selectedEl.type === 'text' || selectedEl.type === 'variable') && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Tamanho Fonte</Label>
                      <Input type="number" min={6} max={72} value={selectedEl.fontSize || 12} onChange={e => updateElement(selectedEl.id, { fontSize: +e.target.value })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs">Peso</Label>
                      <Select value={selectedEl.fontWeight || 'normal'} onValueChange={v => updateElement(selectedEl.id, { fontWeight: v })}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Negrito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => duplicateElement(selectedEl.id)}>
                    <Copy className="h-3 w-3 mr-1" /> Duplicar
                  </Button>
                  <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={() => removeElement(selectedEl.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variables reference */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Variáveis Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {VARIABLES.map(v => (
                  <div key={v.key} className="flex items-center justify-between px-2 py-1 text-xs">
                    <span className="font-mono text-muted-foreground">{v.key}</span>
                    <span>{v.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LabelDesigner;
