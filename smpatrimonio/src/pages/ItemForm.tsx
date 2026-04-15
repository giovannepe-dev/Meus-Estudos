import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, ScanLine, Camera, X, Upload, FileText, FileSpreadsheet, Trash2, Eye, ImagePlus } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { playBeep } from '@/hooks/use-beep';

const tipoOptions = ['BIOMEDICO', 'TI', 'MOBILIARIO', 'INSTRUMENTAL', 'OUTROS'] as const;
const estadoOptions = ['NOVO', 'BOM', 'REGULAR', 'RUIM', 'INSERVIVEL'] as const;
const criticidadeOptions = ['BAIXA', 'MEDIA', 'ALTA'] as const;
const statusOptions = ['EM_USO', 'EM_MANUTENCAO', 'BAIXADO', 'EMPRESTADO'] as const;

const ItemForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    tombo: '', nome_item: '', tipo_item: 'OUTROS' as string,
    categoria_id: '', marca: '', modelo: '', numero_serie: '',
    numero_anvisa: '',
    estado: 'NOVO' as string, criticidade: 'BAIXA' as string,
    status: 'EM_USO' as string, valor_aquisicao: '',
    data_aquisicao: '', data_instalacao: '', sala_atual_id: '',
    responsavel: '', observacoes: ''
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; previewUrl: string }[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo upload state
  const [uploadedPhotos, setUploadedPhotos] = useState<{ file: File; previewUrl: string }[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Scanner state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'tombo' | 'numero_serie'>('tombo');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'tombo-scanner';
  const [scanDetected, setScanDetected] = useState(false);
  const [serialScanDetected, setSerialScanDetected] = useState(false);

  // USB/Bluetooth barcode reader detection
  const keyTimestamps = useRef<number[]>([]);
  const keyBuffer = useRef('');
  const scanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serialKeyTimestamps = useRef<number[]>([]);
  const serialKeyBuffer = useRef('');
  const serialScanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTomboKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    
    if (e.key === 'Enter') {
      // Reader often sends Enter at end of scan
      if (keyBuffer.current.length >= 3) {
        const avgInterval = keyTimestamps.current.length > 1
          ? (keyTimestamps.current[keyTimestamps.current.length - 1] - keyTimestamps.current[0]) / (keyTimestamps.current.length - 1)
          : 999;
        if (avgInterval < 50) {
          // Fast input detected = barcode reader
           setScanDetected(true);
          playBeep();
          toast({ title: 'Código lido pelo leitor!', description: `Tombo: ${form.tombo}` });
          setTimeout(() => setScanDetected(false), 2000);
        }
      }
      keyTimestamps.current = [];
      keyBuffer.current = '';
      return;
    }

    if (e.key.length === 1) {
      keyTimestamps.current.push(now);
      keyBuffer.current += e.key;

      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      scanTimeout.current = setTimeout(() => {
        // Check if input was fast enough to be a reader
        if (keyTimestamps.current.length >= 4) {
          const avgInterval = (keyTimestamps.current[keyTimestamps.current.length - 1] - keyTimestamps.current[0]) / (keyTimestamps.current.length - 1);
          if (avgInterval < 50) {
            setScanDetected(true);
            playBeep();
            toast({ title: 'Código lido pelo leitor!', description: `Tombo: ${keyBuffer.current}` });
            setTimeout(() => setScanDetected(false), 2000);
          }
        }
        keyTimestamps.current = [];
        keyBuffer.current = '';
      }, 200);
    }
  }, [form.tombo, toast]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      try {
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async (target: 'tombo' | 'numero_serie') => {
    await stopScanner();
    setScannerTarget(target);
    await new Promise(r => setTimeout(r, 300));
    
    const el = document.getElementById(scannerContainerId);
    if (!el) return;

    const scanner = new Html5Qrcode(scannerContainerId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          const cleaned = decodedText.trim();
          setForm(f => ({ ...f, [target]: cleaned }));
          playBeep();
          const label = target === 'tombo' ? 'Tombo' : 'Nº Série';
          toast({ title: 'Código lido!', description: `${label}: ${cleaned}` });
          if (target === 'numero_serie') {
            setSerialScanDetected(true);
            setTimeout(() => setSerialScanDetected(false), 2000);
          } else {
            setScanDetected(true);
            setTimeout(() => setScanDetected(false), 2000);
          }
          stopScanner();
          setScannerOpen(false);
        },
        () => {}
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      toast({ title: 'Erro ao abrir câmera', description: err?.message || 'Permita o acesso à câmera.', variant: 'destructive' });
      setScannerOpen(false);
    }
  }, [stopScanner, toast]);

  const handleSerialKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const now = Date.now();
    if (e.key === 'Enter') {
      if (serialKeyBuffer.current.length >= 3) {
        const avgInterval = serialKeyTimestamps.current.length > 1
          ? (serialKeyTimestamps.current[serialKeyTimestamps.current.length - 1] - serialKeyTimestamps.current[0]) / (serialKeyTimestamps.current.length - 1)
          : 999;
        if (avgInterval < 50) {
          setSerialScanDetected(true);
          playBeep();
          toast({ title: 'Nº Série lido pelo leitor!', description: `Série: ${form.numero_serie}` });
          setTimeout(() => setSerialScanDetected(false), 2000);
        }
      }
      serialKeyTimestamps.current = [];
      serialKeyBuffer.current = '';
      e.preventDefault();
      return;
    }
    if (e.key.length === 1) {
      serialKeyTimestamps.current.push(now);
      serialKeyBuffer.current += e.key;
      if (serialScanTimeout.current) clearTimeout(serialScanTimeout.current);
      serialScanTimeout.current = setTimeout(() => {
        if (serialKeyTimestamps.current.length >= 4) {
          const avgInterval = (serialKeyTimestamps.current[serialKeyTimestamps.current.length - 1] - serialKeyTimestamps.current[0]) / (serialKeyTimestamps.current.length - 1);
          if (avgInterval < 50) {
            setSerialScanDetected(true);
            playBeep();
            toast({ title: 'Nº Série lido pelo leitor!', description: `Série: ${serialKeyBuffer.current}` });
            setTimeout(() => setSerialScanDetected(false), 2000);
          }
        }
        serialKeyTimestamps.current = [];
        serialKeyBuffer.current = '';
      }, 200);
    }
  }, [form.numero_serie, toast]);

  useEffect(() => {
    if (scannerOpen) {
      startScanner(scannerTarget);
    }
    return () => { stopScanner(); };
  }, [scannerOpen, startScanner, stopScanner, scannerTarget]);

  const { data: rooms } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('id, nome, sectors(nome, units(nome))');
      if (!data) return [];
      return [...data].sort((a: any, b: any) => {
        const labelA = `${a.sectors?.units?.nome || ''} › ${a.sectors?.nome || ''} › ${a.nome}`;
        const labelB = `${b.sectors?.units?.nome || ''} › ${b.sectors?.nome || ''} › ${b.nome}`;
        return labelA.localeCompare(labelB, 'pt-BR');
      });
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-select'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, nome');
      return data || [];
    }
  });

  const { data: existingItem } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      if (!isEdit) return null;
      const { data } = await supabase.from('items').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit
  });

  // Load existing attachments for edit mode
  const { data: existingAttachmentsData } = useQuery({
    queryKey: ['item-attachments', id],
    queryFn: async () => {
      if (!isEdit) return [];
      const { data } = await supabase.from('item_attachments').select('*').eq('item_id', id!);
      return data || [];
    },
    enabled: isEdit
  });

  useEffect(() => {
    if (existingAttachmentsData) {
      setExistingAttachments(existingAttachmentsData.filter(a => a.tipo !== 'foto'));
      setExistingPhotos(existingAttachmentsData.filter(a => a.tipo === 'foto'));
    }
  }, [existingAttachmentsData]);

  useEffect(() => {
    if (existingItem) {
      setForm({
        tombo: existingItem.tombo,
        nome_item: existingItem.nome_item,
        tipo_item: existingItem.tipo_item,
        categoria_id: existingItem.categoria_id || '',
        marca: existingItem.marca,
        modelo: existingItem.modelo,
        numero_serie: existingItem.numero_serie || '',
        numero_anvisa: (existingItem as any).numero_anvisa || '',
        estado: existingItem.estado,
        criticidade: existingItem.criticidade,
        status: existingItem.status,
        valor_aquisicao: existingItem.valor_aquisicao?.toString() || '',
        data_aquisicao: existingItem.data_aquisicao || '',
        data_instalacao: existingItem.data_instalacao || '',
        sala_atual_id: existingItem.sala_atual_id,
        responsavel: existingItem.responsavel || '',
        observacoes: existingItem.observacoes || ''
      });
    }
  }, [existingItem]);

  // Auto-generate tombo for new items
  useEffect(() => {
    if (!isEdit && !form.tombo) {
      supabase.rpc('get_next_tombo').then(({ data }) => {
        if (data) setForm(f => ({ ...f, tombo: data as string }));
      });
    }
  }, [isEdit]);

  const ACCEPTED_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        toast({ title: 'Tipo não suportado', description: `${f.name} — apenas PDF e Excel.`, variant: 'destructive' });
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: `${f.name} — máximo 20MB.`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    const newFiles = valid.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeUploadedFile = (idx: number) => {
    setUploadedFiles(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeExistingAttachment = async (attachmentId: string) => {
    await supabase.from('item_attachments').delete().eq('id', attachmentId);
    setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
    setExistingPhotos(prev => prev.filter(a => a.id !== attachmentId));
    toast({ title: 'Anexo removido' });
  };

  // Photo handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
      if (!f.type.startsWith('image/')) {
        toast({ title: 'Tipo não suportado', description: `${f.name} — apenas imagens.`, variant: 'destructive' });
        return false;
      }
      if (f.size > 20 * 1024 * 1024) {
        toast({ title: 'Arquivo muito grande', description: `${f.name} — máximo 20MB.`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    const newPhotos = valid.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }));
    setUploadedPhotos(prev => [...prev, ...newPhotos]);
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeUploadedPhoto = (idx: number) => {
    setUploadedPhotos(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  };

  const getFileTipo = (name: string) => {
    if (name.endsWith('.pdf')) return 'pdf';
    return 'excel';
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const payload = {
        tombo: form.tombo,
        nome_item: form.nome_item,
        tipo_item: form.tipo_item as any,
        categoria_id: form.categoria_id || null,
        marca: form.marca,
        modelo: form.modelo,
        numero_serie: form.numero_serie || null,
        numero_anvisa: form.numero_anvisa?.trim() || null,
        estado: form.estado as any,
        criticidade: form.criticidade as any,
        status: form.status as any,
        valor_aquisicao: form.valor_aquisicao ? parseFloat(form.valor_aquisicao) : null,
        data_aquisicao: form.data_aquisicao || null,
        data_instalacao: form.data_instalacao || null,
        sala_atual_id: form.sala_atual_id,
        responsavel: form.responsavel || null,
        observacoes: form.observacoes || null,
      };

      if (!payload.sala_atual_id) {
        throw new Error('Selecione uma sala.');
      }

      let itemId = id;
      if (isEdit) {
        const { error } = await supabase.from('items').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('items').insert(payload).select('id').single();
        if (error) throw error;
        itemId = data.id;
      }

      // Upload new files
      for (const { file } of uploadedFiles) {
        const ext = file.name.split('.').pop();
        const filePath = `${itemId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('item-attachments').upload(filePath, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('item-attachments').getPublicUrl(filePath);
        await supabase.from('item_attachments').insert({
          item_id: itemId!,
          url: urlData.publicUrl,
          tipo: getFileTipo(file.name),
        });
      }

      // Upload new photos
      for (const { file } of uploadedPhotos) {
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `${itemId}/fotos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('item-attachments').upload(filePath, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('item-attachments').getPublicUrl(filePath);
        await supabase.from('item_attachments').insert({
          item_id: itemId!,
          url: urlData.publicUrl,
          tipo: 'foto',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: isEdit ? 'Item atualizado!' : 'Item cadastrado!' });
      navigate('/items');
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button variant="ghost" onClick={() => navigate('/items')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Editar Item' : 'Novo Item'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tombo</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={form.tombo}
                    onChange={e => set('tombo', e.target.value)}
                    onKeyDown={handleTomboKeyDown}
                    required
                    className={`${scanDetected ? 'border-green-500 ring-2 ring-green-500/30' : ''} transition-all`}
                    placeholder="Digite ou escaneie o código"
                  />
                  {scanDetected && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-green-600 animate-pulse">
                      ✓ Lido!
                    </span>
                  )}
                </div>
                 <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { setScannerTarget('tombo'); setScannerOpen(true); }}
                  title="Escanear código de barras ou QR Code"
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite, use o leitor USB/Bluetooth ou clique no ícone para câmera
              </p>
            </div>
            <div className="space-y-2">
              <Label>Nome do Item</Label>
              <Input value={form.nome_item} onChange={e => set('nome_item', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria_id} onValueChange={v => set('categoria_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input value={form.marca} onChange={e => set('marca', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.modelo} onChange={e => set('modelo', e.target.value)} />
            </div>
             <div className="space-y-2">
              <Label>Nº Série</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    value={form.numero_serie}
                    onChange={e => set('numero_serie', e.target.value)}
                    onKeyDown={handleSerialKeyDown}
                    placeholder="Digite ou escaneie o nº série"
                    className={`${serialScanDetected ? 'border-green-500 ring-2 ring-green-500/30' : ''} transition-all`}
                  />
                  {serialScanDetected && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-green-600 animate-pulse">
                      ✓ Lido!
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { setScannerTarget('numero_serie'); setScannerOpen(true); }}
                  title="Escanear nº série pela câmera"
                >
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Aceita letras e números. Use leitor USB/Bluetooth ou câmera.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="tem_anvisa"
                  checked={!!form.numero_anvisa}
                  onCheckedChange={(checked) => {
                    if (!checked) set('numero_anvisa', '');
                    else set('numero_anvisa', ' ');
                  }}
                />
                <Label htmlFor="tem_anvisa" className="cursor-pointer">Possui registro Anvisa</Label>
              </div>
              {!!form.numero_anvisa && (
                <Input
                  value={form.numero_anvisa.trim()}
                  onChange={e => set('numero_anvisa', e.target.value)}
                  placeholder="Número do registro Anvisa"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.estado} onValueChange={v => set('estado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {estadoOptions.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Criticidade</Label>
              <Select value={form.criticidade} onValueChange={v => set('criticidade', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {criticidadeOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sala</Label>
              <Select value={form.sala_atual_id} onValueChange={v => set('sala_atual_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                <SelectContent>
                  {rooms?.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {(r.sectors as any)?.units?.nome} › {(r.sectors as any)?.nome} › {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Aquisição</Label>
              <Input type="number" step="0.01" value={form.valor_aquisicao} onChange={e => set('valor_aquisicao', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Aquisição</Label>
              <Input type="date" value={form.data_aquisicao} onChange={e => set('data_aquisicao', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data Instalação</Label>
              <Input type="date" value={form.data_instalacao} onChange={e => set('data_instalacao', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-3 sm:col-span-2">
              <Label>Fotos do Item</Label>
              <div className="flex gap-2">
                <div
                  className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">Importar foto</p>
                </div>
                <div
                  className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm text-muted-foreground">Tirar foto</p>
                </div>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              {/* Existing photos */}
              {existingPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Fotos existentes:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {existingPhotos.map((photo) => (
                      <div key={photo.id} className="relative group rounded-lg overflow-hidden border aspect-square">
                        <img src={photo.url} alt="Foto do item" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-white hover:text-white hover:bg-white/20" asChild>
                            <a href={photo.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-white hover:text-white hover:bg-white/20" onClick={() => removeExistingAttachment(photo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New photos preview */}
              {uploadedPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Novas fotos:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {uploadedPhotos.map((up, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border aspect-square">
                        <img src={up.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 h-6 w-6 bg-black/50 text-white hover:text-white hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeUploadedPhoto(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="space-y-3 sm:col-span-2">
              <Label>Anexos (PDF / Excel)</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para selecionar arquivos</p>
                <p className="text-xs text-muted-foreground mt-1">PDF ou Excel — máx. 20MB cada</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Existing attachments (edit mode) */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Anexos existentes:</p>
                  {existingAttachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between rounded border p-3 text-sm">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(att.url)}
                        <span className="truncate">{att.url.split('/').pop()}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button type="button" size="sm" variant="ghost" asChild>
                          <a href={att.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeExistingAttachment(att.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* New files preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Novos arquivos:</p>
                  {uploadedFiles.map((uf, idx) => (
                    <div key={idx} className="rounded border overflow-hidden">
                      <div className="flex items-center justify-between p-3 text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getFileIcon(uf.file.name)}
                          <span className="truncate">{uf.file.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(uf.file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive shrink-0" onClick={() => removeUploadedFile(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* PDF preview */}
                      {uf.file.type === 'application/pdf' && (
                        <div className="border-t">
                          <iframe
                            src={uf.previewUrl}
                            className="w-full h-48"
                            title={`Preview ${uf.file.name}`}
                          />
                        </div>
                      )}
                      {/* Excel preview - show file info */}
                      {uf.file.type !== 'application/pdf' && (
                        <div className="border-t bg-muted/50 p-3 text-xs text-muted-foreground flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                          Planilha Excel — o preview estará disponível após o upload
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={mutation.isPending} className="gap-2">
                <Save className="h-4 w-4" /> {mutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={(open) => { if (!open) { stopScanner(); setScannerOpen(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Escanear Código
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Aponte a câmera para o código de barras ou QR Code da etiqueta.
          </p>
          <div id={scannerContainerId} className="w-full min-h-[280px] rounded-lg overflow-hidden bg-muted" />
          <Button variant="outline" onClick={() => { stopScanner(); setScannerOpen(false); }} className="gap-2">
            <X className="h-4 w-4" /> Cancelar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemForm;
