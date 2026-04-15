import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, AlertCircle, Check, Info, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

GlobalWorkerOptions.workerSrc = pdfWorker;

interface ImportItemsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  [key: string]: string | number | null;
}

const FIELDS = [
  { key: 'tombo', label: 'Tombo (Patrimônio)', required: false, hint: 'Se não mapeado, será gerado automaticamente' },
  { key: 'nome_item', label: 'Nome / Descrição do Item', required: true, hint: 'Campo obrigatório' },
  { key: 'local', label: 'Local / Sala', required: false, hint: 'Cria locais automaticamente se não existirem' },
  { key: 'marca', label: 'Marca / Fabricante', required: false, hint: '' },
  { key: 'modelo', label: 'Modelo', required: false, hint: '' },
  { key: 'numero_serie', label: 'Número de Série', required: false, hint: '' },
  { key: 'responsavel', label: 'Responsável', required: false, hint: '' },
  { key: 'observacoes', label: 'Observações', required: false, hint: '' },
  { key: 'valor_aquisicao', label: 'Valor de Aquisição', required: false, hint: '' },
];

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done';

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

const ImportItems: React.FC<ImportItemsProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] }>({ success: 0, errors: [] });
  const [roomId, setRoomId] = useState<string>('');
  const [tipoItem, setTipoItem] = useState<string>('OUTROS');
  const [rooms, setRooms] = useState<any[]>([]);
  const [autoTombo, setAutoTombo] = useState(false);
  const [useLocalFromFile, setUseLocalFromFile] = useState(false);

  const reset = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportProgress(0);
    setImportResults({ success: 0, errors: [] });
    setRoomId('');
    setTipoItem('OUTROS');
    setAutoTombo(false);
    setUseLocalFromFile(false);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  React.useEffect(() => {
    if (open) {
      supabase.from('rooms').select('id, nome, sectors(nome, units(nome))').order('nome').then(({ data }) => {
        setRooms(data || []);
      });
    }
  }, [open]);

  const applyAutoMapping = (cols: string[], data: ParsedRow[]) => {
    setHeaders(cols);
    setRows(data);
    const autoMap: Record<string, string> = {};

    const patterns: Record<string, string[]> = {
      tombo: ['tombo', 'patrimonio', 'pat', 'plaqueta', 'codigo', 'cod', 'numero', 'n°', 'nº', 'registro'],
      nome_item: ['nome', 'descricao', 'item', 'equipamento', 'denominacao', 'produto', 'material', 'bem'],
      local: ['sala', 'local', 'localizacao', 'setor', 'unidade', 'departamento', 'ambiente', 'bloco', 'predio', 'andar', 'location', 'room'],
      marca: ['marca', 'fabricante', 'fab'],
      modelo: ['modelo', 'mod'],
      numero_serie: ['serie', 'serial', 'ns'],
      responsavel: ['responsavel', 'resp', 'servidor', 'usuario'],
      observacoes: ['obs', 'observacao', 'nota', 'detalhe'],
      valor_aquisicao: ['valor', 'preco', 'custo', 'aquisicao'],
    };

    cols.forEach(col => {
      const norm = normalize(col);
      for (const [field, keys] of Object.entries(patterns)) {
        if (!autoMap[field] && keys.some(k => norm.includes(k))) {
          autoMap[field] = col;
          break;
        }
      }
    });

    if (cols.length === 2 && !autoMap.tombo && !autoMap.nome_item) {
      autoMap.tombo = cols[0];
      autoMap.nome_item = cols[1];
    }

    if (!autoMap.tombo) setAutoTombo(true);
    if (autoMap.local) setUseLocalFromFile(true);

    setMapping(autoMap);
    setStep('mapping');
  };

  const processSpreadsheet = (data: Uint8Array) => {
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: '' });
    if (jsonData.length === 0) {
      toast({ title: 'Arquivo vazio', description: 'Nenhum dado encontrado.', variant: 'destructive' });
      return;
    }
    applyAutoMapping(Object.keys(jsonData[0]), jsonData);
  };

  const processPdf = async (data: ArrayBuffer) => {
    try {
      const pdf = await getDocument({ data }).promise;
      const allLines: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as any[];
        const lineMap = new Map<number, { x: number; text: string }[]>();
        items.forEach(item => {
          const y = Math.round(item.transform[5]);
          if (!lineMap.has(y)) lineMap.set(y, []);
          lineMap.get(y)!.push({ x: item.transform[4], text: item.str });
        });
        const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
        sortedYs.forEach(y => {
          const lineItems = lineMap.get(y)!.sort((a, b) => a.x - b.x);
          const lineText = lineItems.map(i => i.text).join(' ').trim();
          if (lineText) allLines.push(lineText);
        });
      }

      if (allLines.length < 2) {
        toast({ title: 'PDF sem dados tabulares', variant: 'destructive' });
        return;
      }

      const splitLine = (line: string) => line.split(/\s{2,}|\t/).map(s => s.trim()).filter(Boolean);
      const parsedRows: ParsedRow[] = [];
      let headerLine = 0;
      let headerParts = splitLine(allLines[0]);
      if (headerParts.length < 2 && allLines.length > 1) {
        headerParts = splitLine(allLines[1]);
        headerLine = 1;
      }

      if (headerParts.length < 2) {
        const cols = ['Coluna1', 'Coluna2'];
        allLines.forEach(line => {
          const parts = splitLine(line);
          if (parts.length >= 2) {
            parsedRows.push({ [cols[0]]: parts[0], [cols[1]]: parts.slice(1).join(' ') });
          }
        });
        if (parsedRows.length === 0) {
          toast({ title: 'Formato não reconhecido', variant: 'destructive' });
          return;
        }
        applyAutoMapping(cols, parsedRows);
        return;
      }

      for (let i = headerLine + 1; i < allLines.length; i++) {
        const parts = splitLine(allLines[i]);
        if (parts.length >= 2) {
          const row: ParsedRow = {};
          headerParts.forEach((h, idx) => { row[h] = parts[idx] ?? ''; });
          if (parts.length > headerParts.length) {
            row[headerParts[headerParts.length - 1]] = parts.slice(headerParts.length - 1).join(' ');
          }
          parsedRows.push(row);
        }
      }

      if (parsedRows.length === 0) {
        toast({ title: 'Nenhum item encontrado', variant: 'destructive' });
        return;
      }
      applyAutoMapping(headerParts, parsedRows);
    } catch (err: any) {
      toast({ title: 'Erro ao ler PDF', description: err.message, variant: 'destructive' });
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || !!file.name.match(/\.pdf$/i);
    const isSpreadsheet = file.type.includes('spreadsheet') || file.type.includes('excel') || file.type === 'text/csv' || !!file.name.match(/\.(xlsx|xls|csv)$/i);
    if (!isPdf && !isSpreadsheet) {
      toast({ title: 'Formato inválido', description: 'Use .xlsx, .xls, .csv ou .pdf', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      if (isPdf) processPdf(buffer);
      else processSpreadsheet(new Uint8Array(buffer));
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const hasLocationSource = useLocalFromFile ? !!mapping.local : !!roomId;
  const canProceedToPreview = mapping.nome_item && hasLocationSource && (mapping.tombo || autoTombo);

  const getMappedRows = () => {
    return rows.map(row => {
      const mapped: Record<string, any> = {};
      Object.entries(mapping).forEach(([field, col]) => {
        if (col) mapped[field] = row[col];
      });
      return mapped;
    }).filter(r => r.nome_item);
  };

  // Cache for created rooms to avoid duplicates
  const roomCache = useRef<Map<string, string>>(new Map());

  const getOrCreateRoom = async (localName: string): Promise<string> => {
    const trimmed = localName.trim();
    if (!trimmed) throw new Error('Local vazio');

    // Check cache first
    if (roomCache.current.has(trimmed)) {
      return roomCache.current.get(trimmed)!;
    }

    // Check existing rooms
    const { data: existingRooms } = await supabase
      .from('rooms')
      .select('id, nome')
      .ilike('nome', trimmed);

    if (existingRooms && existingRooms.length > 0) {
      roomCache.current.set(trimmed, existingRooms[0].id);
      return existingRooms[0].id;
    }

    // Need to create: ensure default unit and sector exist
    let unitId: string;
    const { data: existingUnits } = await supabase
      .from('units')
      .select('id')
      .eq('nome', 'Importação')
      .limit(1);

    if (existingUnits && existingUnits.length > 0) {
      unitId = existingUnits[0].id;
    } else {
      const { data: newUnit, error: unitErr } = await supabase
        .from('units')
        .insert({ nome: 'Importação' })
        .select('id')
        .single();
      if (unitErr) throw unitErr;
      unitId = newUnit.id;
    }

    let sectorId: string;
    const { data: existingSectors } = await supabase
      .from('sectors')
      .select('id')
      .eq('nome', 'Geral')
      .eq('unit_id', unitId)
      .limit(1);

    if (existingSectors && existingSectors.length > 0) {
      sectorId = existingSectors[0].id;
    } else {
      const { data: newSector, error: secErr } = await supabase
        .from('sectors')
        .insert({ nome: 'Geral', unit_id: unitId })
        .select('id')
        .single();
      if (secErr) throw secErr;
      sectorId = newSector.id;
    }

    // Create the room
    const { data: newRoom, error: roomErr } = await supabase
      .from('rooms')
      .insert({ nome: trimmed, sector_id: sectorId })
      .select('id')
      .single();
    if (roomErr) throw roomErr;

    roomCache.current.set(trimmed, newRoom.id);
    return newRoom.id;
  };

  const normalizeTombo = (value: unknown) => String(value ?? '').trim();

  const getExistingTombos = async (tombos: string[]) => {
    const uniqueTombos = [...new Set(tombos.filter(Boolean))];
    const existing = new Set<string>();

    if (uniqueTombos.length === 0) return existing;

    const chunkSize = 300;
    for (let i = 0; i < uniqueTombos.length; i += chunkSize) {
      const chunk = uniqueTombos.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('items')
        .select('tombo')
        .in('tombo', chunk);

      if (error) throw error;
      (data || []).forEach((item) => existing.add(item.tombo));
    }

    return existing;
  };

  const getNextUniqueTombo = async (usedTombos: Set<string>) => {
    for (let attempt = 0; attempt < 20; attempt++) {
      const { data: nextTombo, error } = await supabase.rpc('get_next_tombo');
      if (error) throw error;

      const candidate = normalizeTombo(nextTombo);
      if (candidate && !usedTombos.has(candidate)) {
        return candidate;
      }
    }

    throw new Error('Não foi possível gerar um tombo único automaticamente');
  };

  const handleImport = async () => {
    setStep('importing');
    roomCache.current.clear();
    const mapped = getMappedRows();
    let success = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 50;

    try {
      // Pre-fetch existing tombos
      const providedTombos = mapped.map((row) => normalizeTombo(row.tombo)).filter(Boolean);
      const usedTombos = await getExistingTombos(providedTombos);

      // Pre-generate auto tombos if needed (batch RPC calls)
      let autoTomboQueue: string[] = [];
      if (autoTombo) {
        const needed = mapped.filter(r => !normalizeTombo(r.tombo) || usedTombos.has(normalizeTombo(r.tombo))).length;
        if (needed > 0) {
          setImportProgress(1);
          for (let j = 0; j < needed + 20; j++) {
            try {
              const { data: nextTombo, error } = await supabase.rpc('get_next_tombo');
              if (error) throw error;
              const candidate = normalizeTombo(nextTombo);
              if (candidate && !usedTombos.has(candidate)) {
                autoTomboQueue.push(candidate);
                usedTombos.add(candidate);
              }
            } catch { break; }
          }
        }
      }

      let autoTomboIdx = 0;
      const getAutoTombo = () => {
        if (autoTomboIdx < autoTomboQueue.length) {
          return autoTomboQueue[autoTomboIdx++];
        }
        return null;
      };

      // Pre-resolve all rooms if using local from file
      if (useLocalFromFile && mapping.local) {
        const uniqueLocals = [...new Set(mapped.map(r => r.local ? String(r.local).trim() : '').filter(Boolean))];
        for (const loc of uniqueLocals) {
          try {
            await getOrCreateRoom(loc);
          } catch (err: any) {
            errors.push(`Local "${loc}": ${err.message}`);
          }
        }
        setImportProgress(5);
      }

      // Prepare all payloads
      const payloads: { lineNum: number; payload: any }[] = [];

      for (let i = 0; i < mapped.length; i++) {
        const row = mapped[i];
        try {
          let tomboValue = autoTombo ? '' : normalizeTombo(row.tombo);

          if (!tomboValue || usedTombos.has(tomboValue)) {
            // Tombo vazio ou duplicado: gerar automaticamente

            const newTombo = getAutoTombo();
            if (!newTombo) {
              errors.push(`Linha ${i + 2}: Sem tombos automáticos disponíveis.`);
              continue;
            }
            tomboValue = newTombo;
          } else {
            usedTombos.add(tomboValue);
          }

          let itemRoomId = roomId;
          if (useLocalFromFile && row.local) {
            const cached = roomCache.current.get(String(row.local).trim());
            if (cached) {
              itemRoomId = cached;
            } else {
              errors.push(`Linha ${i + 2} (${tomboValue}): Local "${row.local}" não pôde ser criado.`);
              continue;
            }
          }

          if (!itemRoomId) {
            errors.push(`Linha ${i + 2} (${tomboValue}): Sem local definido.`);
            continue;
          }

          payloads.push({
            lineNum: i + 2,
            payload: {
              tombo: tomboValue,
              nome_item: String(row.nome_item).trim(),
              marca: row.marca ? String(row.marca).trim() : '',
              modelo: row.modelo ? String(row.modelo).trim() : '',
              numero_serie: row.numero_serie ? String(row.numero_serie).trim() : null,
              responsavel: row.responsavel ? String(row.responsavel).trim() : null,
              observacoes: row.observacoes ? String(row.observacoes).trim() : null,
              valor_aquisicao: row.valor_aquisicao ? Number(row.valor_aquisicao) || null : null,
              sala_atual_id: itemRoomId,
              tipo_item: tipoItem as any,
              status: 'EM_USO' as any,
            }
          });
        } catch (err: any) {
          errors.push(`Linha ${i + 2}: ${err.message}`);
        }
      }

      // Insert in batches
      for (let b = 0; b < payloads.length; b += BATCH_SIZE) {
        const batch = payloads.slice(b, b + BATCH_SIZE);
        const { error, data } = await supabase
          .from('items')
          .insert(batch.map(p => p.payload))
          .select('id');

        if (!error) {
          success += batch.length;
        } else {
          // Fallback: insert one by one for this batch to identify the failing rows
          for (const item of batch) {
            const { error: singleErr } = await supabase.from('items').insert(item.payload);
            if (!singleErr) {
              success++;
            } else {
              errors.push(`Linha ${item.lineNum} (${item.payload.tombo}): ${singleErr.message}`);
            }
          }
        }
        setImportProgress(Math.round(((Math.min(b + BATCH_SIZE, payloads.length)) / payloads.length) * 100));
      }
    } catch (err: any) {
      errors.push(`Erro geral: ${err.message}`);
    }

    setImportResults({ success, errors });
    setStep('done');
    queryClient.invalidateQueries({ queryKey: ['items'] });
    queryClient.invalidateQueries({ queryKey: ['rooms-select'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const mappedCount = getMappedRows().length;

  // Get unique locations from mapped data for preview
  const uniqueLocations = useLocalFromFile && mapping.local
    ? [...new Set(getMappedRows().map(r => r.local ? String(r.local).trim() : '').filter(Boolean))]
    : [];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Itens
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Envie um arquivo Excel (.xlsx), CSV ou PDF com os itens a importar.'}
            {step === 'mapping' && 'Mapeie as colunas do arquivo para os campos do sistema.'}
            {step === 'preview' && 'Confira os dados antes de importar.'}
            {step === 'importing' && 'Importando itens...'}
            {step === 'done' && 'Importação concluída!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Clique para selecionar um arquivo</p>
              <p className="text-xs text-muted-foreground mt-1">.xlsx, .xls, .csv ou .pdf</p>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={handleFile} />
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="gap-1">1</Badge> Configure
                <span>→</span>
                <Badge variant="secondary" className="gap-1">2</Badge> Mapeie
                <span>→</span>
                <Badge variant="outline" className="gap-1">3</Badge> Importe
              </div>

              {/* Location source toggle */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" /> Pegar local do arquivo
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {useLocalFromFile
                        ? 'Locais serão criados automaticamente a partir da coluna mapeada'
                        : 'Todos os itens irão para a sala selecionada abaixo'}
                    </p>
                  </div>
                  <Switch checked={useLocalFromFile} onCheckedChange={(v) => setUseLocalFromFile(v)} />
                </div>

                {!useLocalFromFile && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Sala/Local <span className="text-destructive">*</span></label>
                    <Select value={roomId} onValueChange={setRoomId}>
                      <SelectTrigger className={!roomId ? 'border-destructive/50' : ''}>
                        <SelectValue placeholder="Selecione a sala" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.nome} — {(r.sectors as any)?.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {useLocalFromFile && mapping.local && uniqueLocations.length > 0 && (
                  <div className="text-xs">
                    <p className="font-medium mb-1">{uniqueLocations.length} locais detectados:</p>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {uniqueLocations.slice(0, 20).map(loc => (
                        <Badge key={loc} variant="outline" className="text-[10px]">{loc}</Badge>
                      ))}
                      {uniqueLocations.length > 20 && (
                        <Badge variant="outline" className="text-[10px]">+{uniqueLocations.length - 20} mais</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tipo do Item</label>
                  <Select value={tipoItem} onValueChange={setTipoItem}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BIOMEDICO">Biomédico</SelectItem>
                      <SelectItem value="TI">TI</SelectItem>
                      <SelectItem value="MOBILIARIO">Mobiliário</SelectItem>
                      <SelectItem value="INSTRUMENTAL">Instrumental</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm font-medium">Auto tombo</Label>
                    <p className="text-[10px] text-muted-foreground">Gerar sequencial</p>
                  </div>
                  <Switch checked={autoTombo} onCheckedChange={setAutoTombo} />
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium mb-2">Mapeamento de Colunas</p>
                <div className="rounded-lg border divide-y">
                  {FIELDS.map(field => {
                    const isDisabledTombo = field.key === 'tombo' && autoTombo;
                    const isDisabledLocal = field.key === 'local' && !useLocalFromFile;
                    const isDisabled = isDisabledTombo || isDisabledLocal;
                    const isMapped = !!mapping[field.key];
                    const isRequired = field.key === 'nome_item' || (field.key === 'local' && useLocalFromFile);
                    return (
                      <div key={field.key} className={`flex items-center gap-3 px-3 py-2.5 ${isDisabled ? 'opacity-40' : ''}`}>
                        <div className="w-44 shrink-0">
                          <span className="text-sm font-medium">
                            {field.label}
                            {isRequired && <span className="text-destructive"> *</span>}
                          </span>
                          {field.hint && <p className="text-[10px] text-muted-foreground">{field.hint}</p>}
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <Select
                            value={isDisabled ? '_none' : (mapping[field.key] || '_none')}
                            onValueChange={(v) => setMapping(prev => ({ ...prev, [field.key]: v === '_none' ? '' : v }))}
                            disabled={isDisabled}
                          >
                            <SelectTrigger className={`flex-1 ${isMapped && !isDisabled ? 'border-primary/50 bg-primary/5' : ''}`}>
                              <SelectValue placeholder="— Não mapeado —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">— Não mapeado —</SelectItem>
                              {headers.map(h => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isMapped && !isDisabled && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <p><strong>Colunas detectadas:</strong></p>
                  <div className="flex flex-wrap gap-1">
                    {headers.map(h => (
                      <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {rows.length} linhas • {mappedCount} válidas para importar
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <ScrollArea className="h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Tombo</TableHead>
                    <TableHead>Nome</TableHead>
                    {useLocalFromFile && <TableHead>Local</TableHead>}
                    <TableHead>Marca</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMappedRows().slice(0, 50).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-mono">{row.tombo ? String(row.tombo) : <span className="text-muted-foreground italic">Auto</span>}</TableCell>
                      <TableCell>{String(row.nome_item)}</TableCell>
                      {useLocalFromFile && <TableCell>{row.local ? String(row.local) : '—'}</TableCell>}
                      <TableCell>{row.marca ? String(row.marca) : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {mappedCount > 50 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Mostrando 50 de {mappedCount} itens
                </p>
              )}
            </ScrollArea>
          )}

          {step === 'importing' && (
            <div className="py-8 space-y-4 text-center">
              <Progress value={importProgress} />
              <p className="text-sm text-muted-foreground">Importando... {importProgress}%</p>
            </div>
          )}

          {step === 'done' && (
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-2 justify-center">
                <Check className="h-8 w-8 text-success" />
                <span className="text-lg font-medium">{importResults.success} itens importados</span>
              </div>
              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{importResults.errors.length} erros</span>
                  </div>
                  <ScrollArea className="h-[200px] border rounded p-2">
                    {importResults.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive">{err}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={reset}>Voltar</Button>
              <Button disabled={!canProceedToPreview} onClick={() => setStep('preview')}>
                Pré-visualizar ({mappedCount} itens)
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Voltar</Button>
              <Button onClick={handleImport}>
                Importar {mappedCount} itens
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportItems;
