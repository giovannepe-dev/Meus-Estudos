import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Eye, Pencil, Copy, Trash2, Upload } from 'lucide-react';
import ImportItems from '@/components/ImportItems';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusLabels: Record<string, string> = {
  EM_USO: 'Em Uso', EM_MANUTENCAO: 'Em Manutenção', BAIXADO: 'Baixado', EMPRESTADO: 'Emprestado'
};
const statusColors: Record<string, string> = {
  EM_USO: 'bg-[hsl(var(--success))]', EM_MANUTENCAO: 'bg-[hsl(var(--warning))]', BAIXADO: 'bg-muted-foreground', EMPRESTADO: 'bg-primary'
};

const Items: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [importOpen, setImportOpen] = useState(false);

  const { data: rooms } = useQuery({
    queryKey: ['rooms-filter'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id, nome, sectors(nome, units(nome))')
        .order('nome');
      return data || [];
    }
  });
  const { data: items, isLoading } = useQuery({
    queryKey: ['items', search, statusFilter, showInactive, locationFilter],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select('*, rooms(nome, sectors(nome, units(nome))), categories(nome)')
        .order('created_at', { ascending: false });

      if (!showInactive) {
        query = query.eq('is_active', true);
      }
      if (search) {
        query = query.or(`tombo.ilike.%${search}%,nome_item.ilike.%${search}%`);
      }
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (locationFilter && locationFilter !== 'all') {
        query = query.eq('sala_atual_id', locationFilter);
      }

      const { data } = await query.limit(1000);
      return data || [];
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('items').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      if (!variables.is_active && !showInactive) {
        toast({
          title: 'Item desativado',
          description: 'Ative o filtro "Inativos" para visualizar e reativar itens desativados.',
        });
      } else if (variables.is_active) {
        toast({ title: 'Item reativado!' });
      }
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  const duplicateMutation = useMutation({
    mutationFn: async (item: any) => {
      const { data: nextTombo, error: tomboError } = await supabase.rpc('get_next_tombo');
      if (tomboError) throw tomboError;
      const { data: newItem, error } = await supabase.from('items').insert({
        tombo: nextTombo,
        nome_item: item.nome_item,
        tipo_item: item.tipo_item,
        categoria_id: item.categoria_id,
        marca: item.marca,
        modelo: item.modelo,
        numero_serie: null,
        estado: item.estado,
        criticidade: item.criticidade,
        status: 'EM_USO' as any,
        sala_atual_id: item.sala_atual_id,
        responsavel: item.responsavel,
        valor_aquisicao: item.valor_aquisicao,
        data_aquisicao: item.data_aquisicao,
        observacoes: item.observacoes ? `Duplicado do tombo ${item.tombo}. ${item.observacoes}` : `Duplicado do tombo ${item.tombo}`,
      }).select().single();
      if (error) throw error;
      return newItem;
    },
    onSuccess: (newItem) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Item duplicado!', description: `Novo tombo: ${newItem.tombo}` });
    },
    onError: (err: any) => toast({ title: 'Erro ao duplicar', description: err.message, variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Item excluído com sucesso!' });
      setDeleteItem(null);
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
      setDeleteItem(null);
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('items').update({ status: status as any }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' })
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por tombo ou nome..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="shrink-0">
            <Upload className="h-4 w-4" /> <span className="hidden sm:inline">Importar</span>
          </Button>
          <Button onClick={() => navigate('/items/new')} className="shrink-0">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Item</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="EM_USO">Em Uso</SelectItem>
              <SelectItem value="EM_MANUTENCAO">Em Manutenção</SelectItem>
              <SelectItem value="BAIXADO">Baixado</SelectItem>
              <SelectItem value="EMPRESTADO">Emprestado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Local" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os locais</SelectItem>
              {rooms?.map((room: any) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.nome} — {(room.sectors as any)?.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
            Inativos
          </label>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : items && items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item: any) => (
            <Card key={item.id} className={`transition-shadow hover:shadow-md ${!item.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/items/${item.id}`)}>
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs sm:text-sm shrink-0">
                    {item.tombo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{item.nome_item}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.marca} {item.modelo} • {(item.rooms as any)?.nome}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="shrink-0">
                        <Badge className={`${statusColors[item.status]} text-[hsl(var(--primary-foreground))] cursor-pointer hover:opacity-80 text-[10px] sm:text-xs`}>
                          {statusLabels[item.status]}
                        </Badge>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <DropdownMenuItem
                          key={key}
                          disabled={item.status === key}
                          onClick={() => changeStatusMutation.mutate({ id: item.id, status: key })}
                        >
                          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${statusColors[key]}`} />
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Mobile-friendly action row */}
                <div className="flex items-center justify-end gap-1 mt-2 border-t pt-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => {
                      toggleActiveMutation.mutate({ id: item.id, is_active: checked });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center gap-0.5 ml-auto">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/items/${item.id}/edit`); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={duplicateMutation.isPending} onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(item); }}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/items/${item.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Excluir</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-muted-foreground">Nenhum item encontrado.</p>
            <Button className="mt-4" onClick={() => navigate('/items/new')}>Cadastrar primeiro item</Button>
          </CardContent>
        </Card>
      )}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o item <strong>{deleteItem?.nome_item}</strong> (Tombo: {deleteItem?.tombo})? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(deleteItem?.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImportItems open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default Items;
