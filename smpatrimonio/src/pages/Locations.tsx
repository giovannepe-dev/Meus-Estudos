import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, Layers, DoorOpen, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DialogType = 'unit' | 'sector' | 'room' | null;

const Locations: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [parentId, setParentId] = useState('');

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['units'] });
    queryClient.invalidateQueries({ queryKey: ['sectors'] });
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data } = await supabase.from('units').select('*').order('nome');
      return data || [];
    }
  });

  const { data: sectors } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data } = await supabase.from('sectors').select('*, units(nome)').order('nome');
      return data || [];
    }
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('*, sectors(nome, units(nome))').order('nome');
      return data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        // Update
        if (dialogType === 'unit') {
          const { error } = await supabase.from('units').update({ nome }).eq('id', editingId);
          if (error) throw error;
        } else if (dialogType === 'sector') {
          const { error } = await supabase.from('sectors').update({ nome, unit_id: parentId }).eq('id', editingId);
          if (error) throw error;
        } else if (dialogType === 'room') {
          const { error } = await supabase.from('rooms').update({ nome, sector_id: parentId }).eq('id', editingId);
          if (error) throw error;
        }
      } else {
        // Insert
        if (dialogType === 'unit') {
          const { error } = await supabase.from('units').insert({ nome });
          if (error) throw error;
        } else if (dialogType === 'sector') {
          const { error } = await supabase.from('sectors').insert({ nome, unit_id: parentId });
          if (error) throw error;
        } else if (dialogType === 'room') {
          const { error } = await supabase.from('rooms').insert({ nome, sector_id: parentId });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: editingId ? 'Atualizado!' : 'Adicionado!' });
      closeDialog();
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: DialogType; id: string }) => {
      if (type === 'unit') {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) throw error;
      } else if (type === 'sector') {
        const { error } = await supabase.from('sectors').delete().eq('id', id);
        if (error) throw error;
      } else if (type === 'room') {
        const { error } = await supabase.from('rooms').delete().eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: 'Excluído!' });
    },
    onError: (err: any) => toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
  });

  const closeDialog = () => {
    setDialogType(null);
    setEditingId(null);
    setNome('');
    setParentId('');
  };

  const openEdit = (type: DialogType, item: any) => {
    setDialogType(type);
    setEditingId(item.id);
    setNome(item.nome);
    if (type === 'sector') setParentId(item.unit_id);
    if (type === 'room') setParentId(item.sector_id);
  };

  const openNew = (type: DialogType) => {
    setDialogType(type);
    setEditingId(null);
    setNome('');
    setParentId('');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Units */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5" /> Unidades</CardTitle>
            <Button size="sm" onClick={() => openNew('unit')}><Plus className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {units?.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span className="font-medium">{u.nome}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit('unit', u)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ type: 'unit', id: u.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {(!units || units.length === 0) && <p className="text-sm text-muted-foreground">Nenhuma unidade.</p>}
          </CardContent>
        </Card>

        {/* Sectors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-5 w-5" /> Setores</CardTitle>
            <Button size="sm" onClick={() => openNew('sector')}><Plus className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {sectors?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <span className="font-medium">{s.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{(s.units as any)?.nome}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit('sector', s)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ type: 'sector', id: s.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {(!sectors || sectors.length === 0) && <p className="text-sm text-muted-foreground">Nenhum setor.</p>}
          </CardContent>
        </Card>

        {/* Rooms */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><DoorOpen className="h-5 w-5" /> Salas</CardTitle>
            <Button size="sm" onClick={() => openNew('room')}><Plus className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {rooms?.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <span className="font-medium">{r.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {(r.sectors as any)?.units?.nome} › {(r.sectors as any)?.nome}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit('room', r)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ type: 'room', id: r.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {(!rooms || rooms.length === 0) && <p className="text-sm text-muted-foreground">Nenhuma sala.</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!dialogType} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar' : dialogType === 'unit' ? 'Nova Unidade' : dialogType === 'sector' ? 'Novo Setor' : 'Nova Sala'}
              {editingId && (dialogType === 'unit' ? ' Unidade' : dialogType === 'sector' ? ' Setor' : ' Sala')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome..." />
            </div>
            {dialogType === 'sector' && (
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {units?.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {dialogType === 'room' && (
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {sectors?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{(s.units as any)?.nome} › {s.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => saveMutation.mutate()} disabled={!nome || (dialogType !== 'unit' && !parentId)}>
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Locations;
