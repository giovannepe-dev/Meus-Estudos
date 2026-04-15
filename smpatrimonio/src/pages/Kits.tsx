import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Boxes, Plus, Trash2, Search, Package, MapPin, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface KitLocation {
  sala_id: string;
  tombo: string;
}

const Kits: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editKit, setEditKit] = useState<any>(null);
  const [viewKit, setViewKit] = useState<any>(null);
  const [search, setSearch] = useState('');

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');

  // Locations with tombos
  const [kitLocations, setKitLocations] = useState<KitLocation[]>([]);
  const [newLocSala, setNewLocSala] = useState('');
  const [newLocTombo, setNewLocTombo] = useState('');

  // Item addition
  const [itemSearch, setItemSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  const { data: kits, isLoading } = useQuery({
    queryKey: ['kits', search],
    queryFn: async () => {
      let query = supabase
        .from('kits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (search) query = query.ilike('nome', `%${search}%`);
      const { data } = await query;
      if (!data) return [];
      const results = await Promise.all(data.map(async (kit: any) => {
        const { count } = await supabase
          .from('kit_items')
          .select('id', { count: 'exact', head: true })
          .eq('kit_id', kit.id);
        const { data: locs } = await supabase
          .from('kit_locations' as any)
          .select('tombo, sala_id, rooms(nome, sectors(nome, units(nome)))')
          .eq('kit_id', kit.id);
        return { ...kit, item_count: count || 0, locations: locs || [] };
      }));
      return results;
    }
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data } = await supabase.from('rooms').select('id, nome, sectors(nome, units(nome))');
      return data || [];
    }
  });

  const { data: allItems } = useQuery({
    queryKey: ['items-for-kit', itemSearch],
    queryFn: async () => {
      let query = supabase.from('items').select('id, tombo, nome_item').eq('is_active', true);
      if (itemSearch) query = query.or(`tombo.ilike.%${itemSearch}%,nome_item.ilike.%${itemSearch}%`);
      const { data } = await query.limit(20);
      return data || [];
    },
    enabled: showForm || !!editKit
  });

  const { data: kitItems } = useQuery({
    queryKey: ['kit-items', viewKit?.id],
    queryFn: async () => {
      if (!viewKit) return [];
      const { data } = await supabase
        .from('kit_items')
        .select('id, item_id, items(id, tombo, nome_item, status, rooms:sala_atual_id(nome, sectors(nome, units(nome))))')
        .eq('kit_id', viewKit.id);
      return data || [];
    },
    enabled: !!viewKit
  });

  const resetForm = () => {
    setFormNome('');
    setFormDescricao('');
    setKitLocations([]);
    setNewLocSala('');
    setNewLocTombo('');
    setSelectedItems([]);
    setItemSearch('');
  };

  const openCreate = () => {
    resetForm();
    setEditKit(null);
    setShowForm(true);
  };

  const openEdit = async (kit: any) => {
    setFormNome(kit.nome);
    setFormDescricao(kit.descricao || '');
    // Load locations
    const { data: locs } = await supabase
      .from('kit_locations' as any)
      .select('sala_id, tombo')
      .eq('kit_id', kit.id);
    setKitLocations((locs as any[])?.map((l: any) => ({ sala_id: l.sala_id, tombo: l.tombo })) || []);
    // Load items
    const { data } = await supabase
      .from('kit_items')
      .select('item_id, items(id, tombo, nome_item)')
      .eq('kit_id', kit.id);
    setSelectedItems(data?.map((d: any) => d.items) || []);
    setEditKit(kit);
    setShowForm(true);
  };

  const addLocation = () => {
    if (!newLocSala || !newLocTombo) {
      toast({ title: 'Preencha sala e tombo', variant: 'destructive' });
      return;
    }
    if (kitLocations.find(l => l.sala_id === newLocSala)) {
      toast({ title: 'Sala já adicionada', variant: 'destructive' });
      return;
    }
    setKitLocations(prev => [...prev, { sala_id: newLocSala, tombo: newLocTombo }]);
    setNewLocSala('');
    setNewLocTombo('');
  };

  const removeLocation = (salaId: string) => {
    setKitLocations(prev => prev.filter(l => l.sala_id !== salaId));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formNome) throw new Error('Preencha o nome do kit');
      if (kitLocations.length === 0) throw new Error('Adicione pelo menos um local com tombo');

      const payload = {
        nome: formNome,
        descricao: formDescricao || null,
        tombo: kitLocations[0].tombo, // primary tombo
      };

      let kitId: string;
      if (editKit) {
        const { error } = await supabase.from('kits').update(payload).eq('id', editKit.id);
        if (error) throw error;
        kitId = editKit.id;
        await supabase.from('kit_items').delete().eq('kit_id', kitId);
        await (supabase.from('kit_locations' as any) as any).delete().eq('kit_id', kitId);
      } else {
        const { data, error } = await supabase.from('kits').insert(payload).select().single();
        if (error) throw error;
        kitId = data.id;
      }

      // Insert locations
      const locRows = kitLocations.map(l => ({ kit_id: kitId, sala_id: l.sala_id, tombo: l.tombo }));
      const { error: locErr } = await (supabase.from('kit_locations' as any) as any).insert(locRows);
      if (locErr) throw locErr;

      // Insert items
      if (selectedItems.length > 0) {
        const rows = selectedItems.map(item => ({ kit_id: kitId, item_id: item.id }));
        const { error } = await supabase.from('kit_items').insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editKit ? 'Kit atualizado!' : 'Kit criado!' });
      setShowForm(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['kits'] });
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kits').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Kit removido!' });
      queryClient.invalidateQueries({ queryKey: ['kits'] });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (kit: any) => {
      // Create new kit
      const { data: newKit, error } = await supabase.from('kits').insert({
        nome: `${kit.nome} (Cópia)`,
        descricao: kit.descricao || null,
        tombo: `${kit.locations?.[0]?.tombo || kit.tombo}-COPY`,
      }).select().single();
      if (error) throw error;

      // Copy locations with "-COPY" suffix on tombos
      if (kit.locations?.length > 0) {
        const locRows = kit.locations.map((loc: any) => ({
          kit_id: newKit.id,
          sala_id: loc.sala_id,
          tombo: `${loc.tombo}-COPY`,
        }));
        await supabase.from('kit_locations').insert(locRows);
      }

      // Copy items
      const { data: items } = await supabase
        .from('kit_items')
        .select('item_id')
        .eq('kit_id', kit.id);
      if (items && items.length > 0) {
        const itemRows = items.map((i: any) => ({ kit_id: newKit.id, item_id: i.item_id }));
        await supabase.from('kit_items').insert(itemRows);
      }

      return newKit;
    },
    onSuccess: (newKit) => {
      toast({ title: 'Kit duplicado!', description: 'Edite os tombos do novo kit.' });
      queryClient.invalidateQueries({ queryKey: ['kits'] });
      // Open edit for the new kit so user can change tombos
      openEdit({ ...newKit, id: newKit.id });
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao duplicar', description: err.message, variant: 'destructive' });
    }
  });

  const addItem = (item: any) => {
    if (!selectedItems.find(s => s.id === item.id)) {
      setSelectedItems(prev => [...prev, item]);
    }
    setItemSearch('');
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const getRoomLabel = (r: any) => {
    if (!r) return '';
    return `${(r.sectors as any)?.units?.nome} › ${(r.sectors as any)?.nome} › ${r.nome}`;
  };

  const getRoomLabelById = (salaId: string) => {
    const r = rooms?.find((rm: any) => rm.id === salaId);
    if (!r) return salaId;
    return `${(r.sectors as any)?.units?.nome} › ${(r.sectors as any)?.nome} › ${r.nome}`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2"><Boxes className="h-5 w-5" /> Kits</h2>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Novo Kit</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar kits..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : kits?.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum kit cadastrado</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {kits?.map((kit: any) => (
            <Card key={kit.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewKit(kit)}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{kit.nome}</span>
                    {kit.locations?.map((loc: any) => (
                      <Badge key={loc.tombo} variant="outline" className="font-mono text-xs">
                        {loc.tombo}
                      </Badge>
                    ))}
                  </div>
                  {kit.descricao && <p className="text-xs text-muted-foreground truncate">{kit.descricao}</p>}
                  {kit.locations?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {kit.locations.map((loc: any) => (
                        <span key={loc.sala_id} className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {loc.rooms ? getRoomLabel(loc.rooms) : ''} ({loc.tombo})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge variant="secondary"><Package className="h-3 w-3 mr-1" />{kit.item_count} itens</Badge>
                  <Button size="sm" variant="ghost" title="Duplicar" onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(kit); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(kit); }}>Editar</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(kit.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editKit ? 'Editar Kit' : 'Novo Kit'}</DialogTitle>
            <DialogDescription>Defina o kit, adicione locais com tombos e os itens que fazem parte dele.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome do Kit *</Label>
              <Input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Kit de Emergência" />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea value={formDescricao} onChange={e => setFormDescricao(e.target.value)} placeholder="Descrição opcional..." rows={2} />
            </div>

            {/* Locations with tombos */}
            <div className="space-y-2">
              <Label>Locais e Tombos ({kitLocations.length})</Label>
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Sala</Label>
                  <Select value={newLocSala} onValueChange={setNewLocSala}>
                    <SelectTrigger><SelectValue placeholder="Selecione a sala" /></SelectTrigger>
                    <SelectContent>
                      {rooms?.filter((r: any) => !kitLocations.find(l => l.sala_id === r.id)).map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {(r.sectors as any)?.units?.nome} › {(r.sectors as any)?.nome} › {r.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tombo</Label>
                  <Input value={newLocTombo} onChange={e => setNewLocTombo(e.target.value)} placeholder="KIT-001" className="w-32" />
                </div>
                <Button type="button" size="sm" onClick={addLocation} className="mb-0.5">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {kitLocations.length > 0 && (
                <div className="space-y-1">
                  {kitLocations.map(loc => (
                    <div key={loc.sala_id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span>
                        <Badge variant="outline" className="font-mono mr-2">{loc.tombo}</Badge>
                        {getRoomLabelById(loc.sala_id)}
                      </span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeLocation(loc.sala_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Itens do Kit ({selectedItems.length})</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar item por tombo ou nome..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
              </div>
              {itemSearch && allItems && allItems.length > 0 && (
                <div className="max-h-32 overflow-y-auto border rounded-md divide-y">
                  {allItems.filter(i => !selectedItems.find(s => s.id === i.id)).map((item: any) => (
                    <button key={item.id} className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors" onClick={() => addItem(item)}>
                      <span className="font-mono text-xs">[{item.tombo}]</span> {item.nome_item}
                    </button>
                  ))}
                </div>
              )}
              {selectedItems.length > 0 && (
                <div className="space-y-1">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded border p-2 text-sm">
                      <span><span className="font-mono">[{item.tombo}]</span> {item.nome_item}</span>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!formNome || kitLocations.length === 0}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Kit Dialog */}
      <Dialog open={!!viewKit} onOpenChange={(open) => !open && setViewKit(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Kit: {viewKit?.nome}
            </DialogTitle>
            <DialogDescription>
              {viewKit?.descricao && <>{viewKit.descricao}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Locations */}
            {viewKit?.locations?.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium flex items-center gap-1"><MapPin className="h-4 w-4" /> Locais ({viewKit.locations.length}):</p>
                {viewKit.locations.map((loc: any) => (
                  <div key={loc.tombo} className="flex items-center gap-2 rounded border p-2 text-sm">
                    <Badge variant="outline" className="font-mono">{loc.tombo}</Badge>
                    <span className="text-muted-foreground">{loc.rooms ? getRoomLabel(loc.rooms) : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Items */}
            <div className="space-y-1">
              <p className="text-sm font-medium">{kitItems?.length || 0} item(ns) no kit:</p>
              {kitItems?.map((ki: any) => {
                const item = ki.items;
                const room = item?.rooms;
                const loc = room ? `${(room.sectors as any)?.units?.nome} › ${(room.sectors as any)?.nome} › ${room.nome}` : '';
                const statusLabels: Record<string, string> = {
                  'EM_USO': 'Em uso', 'EM_MANUTENCAO': 'Manutenção', 'BAIXADO': 'Baixado',
                  'EMPRESTADO': 'Emprestado', 'EM_DIVERGENCIA': 'Divergência'
                };
                return (
                  <div key={ki.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono">[{item?.tombo}]</span> {item?.nome_item}
                      {loc && <p className="text-xs text-muted-foreground">📍 {loc}</p>}
                    </div>
                    <Badge variant={item?.status === 'EM_USO' ? 'default' : 'secondary'} className="shrink-0 ml-2">
                      {statusLabels[item?.status] || item?.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Kits;
