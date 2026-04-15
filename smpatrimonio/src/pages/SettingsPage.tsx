import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, Volume2, Trash2, AlertTriangle } from 'lucide-react';
import { isBeepEnabled, setBeepEnabled, playBeep } from '@/hooks/use-beep';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

const CLEAR_OPTIONS = [
  { key: 'items', label: 'Itens', tables: ['inventory_scans', 'item_audit_logs', 'item_attachments', 'kit_items', 'movements', 'maintenances', 'items'] },
  { key: 'kits', label: 'Kits', tables: ['kit_items', 'kit_locations', 'kits'] },
  { key: 'locations', label: 'Locais (Salas, Setores, Unidades)', tables: ['inventory_scans', 'inventories', 'kit_locations', 'movements', 'items', 'rooms', 'sectors', 'units'] },
  { key: 'categories', label: 'Categorias', tables: ['categories'] },
  { key: 'movements', label: 'Movimentações', tables: ['movements'] },
  { key: 'maintenances', label: 'Manutenções', tables: ['maintenances'] },
  { key: 'inventories', label: 'Inventários', tables: ['inventory_scans', 'inventories'] },
  { key: 'notifications', label: 'Notificações', tables: ['notifications'] },
] as const;

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [beepOn, setBeepOn] = useState(isBeepEnabled());
  const [selectedClear, setSelectedClear] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('*').limit(1).single();
      return data;
    }
  });

  const [form, setForm] = useState({
    tombo_mode: 'AUTO_SEQUENCIAL',
    tombo_padding: '6',
    label_mode: 'QRCODE',
    alert_days_before: '15'
  });

  useEffect(() => {
    if (settings) {
      setForm({
        tombo_mode: settings.tombo_mode,
        tombo_padding: settings.tombo_padding.toString(),
        label_mode: settings.label_mode,
        alert_days_before: settings.alert_days_before.toString()
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      const { error } = await supabase.from('app_settings').update({
        tombo_mode: form.tombo_mode as any,
        tombo_padding: parseInt(form.tombo_padding),
        label_mode: form.label_mode as any,
        alert_days_before: parseInt(form.alert_days_before)
      }).eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast({ title: 'Configurações salvas!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const toggleClearOption = (key: string) => {
    setSelectedClear(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleClearData = async () => {
    if (selectedClear.length === 0) return;
    setClearing(true);
    try {
      const tablesToClear = new Set<string>();
      for (const opt of CLEAR_OPTIONS) {
        if (selectedClear.includes(opt.key)) {
          opt.tables.forEach(t => tablesToClear.add(t));
        }
      }

      const orderedTables = [
        'inventory_scans', 'item_audit_logs', 'item_attachments',
        'kit_items', 'kit_locations', 'movements', 'maintenances',
        'notifications', 'items', 'kits', 'inventories',
        'categories', 'rooms', 'sectors', 'units'
      ].filter(t => tablesToClear.has(t));

      for (const table of orderedTables) {
        const { error } = await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(`Erro ao limpar ${table}: ${error.message}`);
      }

      queryClient.invalidateQueries();
      setSelectedClear([]);
      toast({ title: 'Dados apagados com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro ao limpar dados', description: err.message, variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modo do Tombo</Label>
            <Select value={form.tombo_mode} onValueChange={v => setForm(f => ({ ...f, tombo_mode: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO_SEQUENCIAL">Automático Sequencial</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dígitos do Tombo (padding)</Label>
            <Input type="number" min="3" max="12" value={form.tombo_padding} onChange={e => setForm(f => ({ ...f, tombo_padding: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Modo da Etiqueta</Label>
            <Select value={form.label_mode} onValueChange={v => setForm(f => ({ ...f, label_mode: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="QRCODE">QR Code</SelectItem>
                <SelectItem value="BARCODE">Código de Barras</SelectItem>
                <SelectItem value="BOTH">Ambos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Dias de alerta antes da manutenção</Label>
            <Input type="number" min="1" max="90" value={form.alert_days_before} onChange={e => setForm(f => ({ ...f, alert_days_before: e.target.value }))} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Som de leitura (bip)</Label>
              <p className="text-xs text-muted-foreground">Emitir bip ao escanear código de barras ou QR Code</p>
            </div>
            <Switch
              checked={beepOn}
              onCheckedChange={(checked) => {
                setBeepOn(checked);
                setBeepEnabled(checked);
                if (checked) playBeep();
                toast({ title: checked ? 'Bip ativado' : 'Bip desativado' });
              }}
            />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full gap-2">
            <Save className="h-4 w-4" /> Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> Limpar Dados do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione quais dados deseja apagar. Esta ação é irreversível.
          </p>
          <div className="space-y-3">
            {CLEAR_OPTIONS.map(opt => (
              <div key={opt.key} className="flex items-center gap-3">
                <Checkbox
                  id={`clear-${opt.key}`}
                  checked={selectedClear.includes(opt.key)}
                  onCheckedChange={() => toggleClearOption(opt.key)}
                />
                <Label htmlFor={`clear-${opt.key}`} className="cursor-pointer text-sm">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full gap-2"
                disabled={selectedClear.length === 0 || clearing}
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? 'Apagando...' : `Apagar ${selectedClear.length} categoria(s) selecionada(s)`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" /> Confirmar exclusão
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    Você está prestes a apagar permanentemente os seguintes dados:
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {selectedClear.map(k => (
                        <li key={k}>{CLEAR_OPTIONS.find(o => o.key === k)?.label}</li>
                      ))}
                    </ul>
                    <span className="mt-2 block font-semibold text-destructive">Esta ação não pode ser desfeita.</span>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Sim, apagar tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
