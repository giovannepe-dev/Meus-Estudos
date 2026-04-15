import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Tag, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Categories: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('nome');
      return data || [];
    }
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('categories').insert({ nome });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Categoria adicionada!' });
      setNome('');
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('categories').update({ nome: editNome }).eq('id', editingId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Categoria atualizada!' });
      setDialogOpen(false);
      setEditingId(null);
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Categoria removida!' });
      setDeleteTarget(null);
    },
    onError: (err: any) => toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('categories').update({ is_active } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditNome(cat.nome);
    setDialogOpen(true);
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Categorias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Nova categoria..." value={nome} onChange={e => setNome(e.target.value)} />
            <Button onClick={() => nome && addMutation.mutate()} disabled={!nome}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="space-y-2">
            {categories?.map((c: any) => (
              <div key={c.id} className={`flex items-center justify-between rounded-lg border p-3 text-sm ${c.is_active === false ? 'opacity-50' : ''}`}>
                <span className="font-medium">{c.nome}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={c.is_active !== false}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: c.id, is_active: checked })}
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(c)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={editNome} onChange={e => setEditNome(e.target.value)} />
          </div>
          <DialogFooter>
            <Button onClick={() => updateMutation.mutate()} disabled={!editNome}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria <strong>{deleteTarget?.nome}</strong>? Itens vinculados perderão a categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(deleteTarget?.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categories;
