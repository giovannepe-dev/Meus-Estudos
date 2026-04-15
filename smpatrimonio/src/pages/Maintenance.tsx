import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

const tipoOptions = ['PREVENTIVA', 'CORRETIVA', 'CALIBRACAO'] as const;

const Maintenance: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tombo, setTombo] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [form, setForm] = useState({
    tipo: 'PREVENTIVA' as string,
    data: new Date().toISOString().split('T')[0],
    custo: '', fornecedor: '', observacao: '', proxima_manutencao_data: ''
  });

  const { data: maintenances } = useQuery({
    queryKey: ['maintenances'],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenances')
        .select('*, items(tombo, nome_item)')
        .order('data', { ascending: false })
        .limit(50);
      return data || [];
    }
  });

  const searchItem = async () => {
    if (!tombo.trim()) return;
    const { data } = await supabase.from('items').select('id, tombo, nome_item').eq('tombo', tombo.trim()).maybeSingle();
    if (data) setSelectedItem(data);
    else toast({ title: 'Item não encontrado', variant: 'destructive' });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedItem) return;
      const { error } = await supabase.from('maintenances').insert({
        item_id: selectedItem.id,
        tipo: form.tipo as any,
        data: form.data,
        custo: form.custo ? parseFloat(form.custo) : null,
        fornecedor: form.fornecedor || null,
        observacao: form.observacao || null,
        proxima_manutencao_data: form.proxima_manutencao_data || null
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      toast({ title: 'Manutenção registrada!' });
      setDialogOpen(false);
      setSelectedItem(null);
      setTombo('');
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Registros de Manutenção</h2>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nova</Button>
      </div>

      <div className="space-y-3">
        {maintenances?.map((m: any) => (
          <Card key={m.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <Wrench className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="font-medium">[{(m.items as any)?.tombo}] {(m.items as any)?.nome_item}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{m.tipo}</Badge>
                  <span>{format(new Date(m.data), 'dd/MM/yyyy')}</span>
                  {m.custo && <span>R$ {Number(m.custo).toFixed(2)}</span>}
                </div>
              </div>
              {m.proxima_manutencao_data && (
                <span className="text-xs text-primary">Próx: {format(new Date(m.proxima_manutencao_data), 'dd/MM/yyyy')}</span>
              )}
            </CardContent>
          </Card>
        ))}
        {(!maintenances || maintenances.length === 0) && (
          <p className="text-sm text-muted-foreground">Nenhum registro de manutenção.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Manutenção</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tombo do Item</Label>
              <div className="flex gap-2">
                <Input value={tombo} onChange={e => setTombo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchItem()} placeholder="Tombo..." />
                <Button variant="outline" onClick={searchItem}><Search className="h-4 w-4" /></Button>
              </div>
              {selectedItem && (
                <p className="text-sm text-muted-foreground">[{selectedItem.tombo}] {selectedItem.nome_item}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Custo</Label>
                <Input type="number" step="0.01" value={form.custo} onChange={e => setForm(f => ({ ...f, custo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              <Input value={form.fornecedor} onChange={e => setForm(f => ({ ...f, fornecedor: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Próxima Manutenção</Label>
              <Input type="date" value={form.proxima_manutencao_data} onChange={e => setForm(f => ({ ...f, proxima_manutencao_data: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => addMutation.mutate()} disabled={!selectedItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Maintenance;
