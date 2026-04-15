import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyWhatsApp } from "@/utils/getCompanyWhatsApp";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Plus, Car, Clock, MapPin, User, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusColors: Record<string, string> = {
  agendado: "bg-primary text-primary-foreground",
  confirmado: "bg-success text-success-foreground",
  cancelado: "bg-muted text-muted-foreground",
  concluido: "bg-secondary text-secondary-foreground",
};

const statusLabels: Record<string, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
};

const Bookings: React.FC = () => {
  const { user, role, profile } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [form, setForm] = useState({
    veiculo_id: "",
    motivo: "",
    destino: "",
    data_inicio: "",
    hora_inicio: "08:00",
    data_fim: "",
    hora_fim: "17:00",
  });

  useEffect(() => {
    fetchBookings();
    fetchVehicles();
    if (role === "admin" || role === "frota") {
      fetchProfiles();
    }
  }, [role]);

  const fetchBookings = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase
      .from("vehicle_bookings")
      .select("*, vehicles(placa, prefixo, marca, modelo)")
      .eq("company_id", profile.company_id)
      .neq("status", "cancelado")
      .order("data_inicio", { ascending: true });
    
    // Fetch profile names for bookings
    if (data && data.length > 0) {
      const motoristIds = [...new Set(data.map((b: any) => b.motorista_id))];
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, nome, setor")
        .in("user_id", motoristIds);
      const profMap = Object.fromEntries((profs || []).map((p: any) => [p.user_id, { nome: p.nome, setor: p.setor }]));
      setBookings(data.map((b: any) => ({ ...b, motorista_nome: profMap[b.motorista_id]?.nome || "?", motorista_setor: profMap[b.motorista_id]?.setor || null })));
    } else {
      setBookings(data || []);
    }
  };

  const fetchVehicles = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase.from("vehicles").select("*").eq("company_id", profile.company_id).in("status", ["disponivel", "em_uso"]).order("prefixo");
    setVehicles(data || []);
  };

  const fetchProfiles = async () => {
    if (!profile?.company_id) return;
    const { data } = await supabase.from("profiles").select("user_id, nome").eq("company_id", profile.company_id).eq("ativo", true);
    setProfiles(data || []);
  };

  const sendWhatsAppNotification = async (booking: any) => {
    const waPhone = await getCompanyWhatsApp();
    if (!waPhone) return;

    const vehicle = vehicles.find((v) => v.id === booking.veiculo_id);
    const vehicleName = vehicle ? (vehicle.prefixo || vehicle.placa) : "?";
    
    // Fetch full profile name
    const { data: profile } = await supabase.from("profiles").select("nome, setor, email").eq("user_id", user?.id).single();
    const userName = profile?.nome || user?.email || "?";
    const userEmail = profile?.email || user?.email || "";
    const userSetor = profile?.setor ? `\n🏛️ *Setor:* ${profile.setor}` : "";

    const inicio = new Date(booking.data_inicio);
    const fim = new Date(booking.data_fim);

    const message = `📌 *Novo Agendamento de Veículo*\n\n` +
      `🧑‍💼 *Solicitante:* ${userName}\n📩 *Email:* ${userEmail}${userSetor}\n` +
      `🚘 *Veículo:* ${vehicleName}\n` +
      `📝 *Motivo:* ${booking.motivo}\n` +
      `📍 *Destino:* ${booking.destino || "Não informado"}\n` +
      `🗓️ *Data:* ${format(inicio, "dd/MM/yyyy", { locale: ptBR })}\n` +
      `⏰ *Horário:* ${format(inicio, "HH:mm")} às ${format(fim, "HH:mm")}\n`;

    const phone = waPhone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    toast.success("Agendamento criado! Redirecionando para WhatsApp...");
    window.open(url, "_blank");
  };

  const handleSave = async () => {
    if (saving) return;
    if (!form.veiculo_id || !form.motivo.trim() || !form.data_inicio || !form.data_fim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const dataInicio = new Date(`${form.data_inicio}T${form.hora_inicio}:00`);
    const dataFim = new Date(`${form.data_fim}T${form.hora_fim}:00`);

    if (dataFim <= dataInicio) {
      toast.error("Data/hora fim deve ser posterior à data/hora início");
      return;
    }

    setSaving(true);
    try {
      // Check for conflicts
      const { data: conflicts } = await supabase
        .from("vehicle_bookings")
        .select("id")
        .eq("veiculo_id", form.veiculo_id)
        .in("status", ["agendado", "confirmado"])
        .lt("data_inicio", dataFim.toISOString())
        .gt("data_fim", dataInicio.toISOString());

      if (conflicts && conflicts.length > 0) {
        toast.error("Já existe um agendamento para este veículo neste período");
        return;
      }

      const payload = {
        veiculo_id: form.veiculo_id,
        motorista_id: user!.id,
        motivo: form.motivo.trim(),
        destino: form.destino.trim() || null,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
      };

      const { error } = await supabase.from("vehicle_bookings").insert(payload as any);
      if (error) {
        if (error.message.includes("Já existe um agendamento")) {
          toast.error("⚠️ Este veículo já possui um agendamento para o período selecionado. Escolha outro veículo ou altere as datas.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      await sendWhatsAppNotification(payload);
      setDialogOpen(false);
      resetForm();
      fetchBookings();
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ veiculo_id: "", motivo: "", destino: "", data_inicio: "", hora_inicio: "08:00", data_fim: "", hora_fim: "17:00" });
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("vehicle_bookings").update({ status: "cancelado" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Agendamento cancelado");
      fetchBookings();
    }
  };

  // Calendar helpers
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const activeBookings = bookings.filter((b) => b.status === "agendado" || b.status === "confirmado");

  const getBookingsForDay = (day: Date) => {
    return activeBookings.filter((b) => {
      const start = startOfDay(new Date(b.data_inicio));
      const end = startOfDay(new Date(b.data_fim));
      const dayStart = startOfDay(day);
      return dayStart >= start && dayStart <= end;
    });
  };

  const selectedDayBookings = selectedDate
    ? bookings.filter((b) => {
        const start = startOfDay(new Date(b.data_inicio));
        const end = startOfDay(new Date(b.data_fim));
        const sel = startOfDay(selectedDate);
        return sel >= start && sel <= end;
      })
    : [];

  // Get first day of week offset (0=Sunday)
  const firstDayOffset = monthStart.getDay();

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Agendamentos</h1>
          <p className="text-sm text-muted-foreground">{activeBookings.length} agendamentos ativos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" />Agendar</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Veículo *</Label>
                <Select value={form.veiculo_id} onValueChange={(v) => setForm({ ...form, veiculo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o veículo" /></SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.prefixo || v.placa} — {v.marca} {v.modelo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motivo *</Label>
                <Textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Motivo do agendamento" />
              </div>
              <div>
                <Label>Destino / Local</Label>
                <Input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} placeholder="Destino ou local" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Início *</Label>
                  <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value, data_fim: form.data_fim || e.target.value })} />
                </div>
                <div>
                  <Label>Hora Início *</Label>
                  <Input type="time" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Fim *</Label>
                  <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
                </div>
                <div>
                  <Label>Hora Fim *</Label>
                  <Input type="time" value={form.hora_fim} onChange={(e) => setForm({ ...form, hora_fim: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-base capitalize">
              {format(calendarMonth, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground mb-1">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 lg:h-14" />
            ))}
            {daysInMonth.map((day) => {
              const dayBookings = getBookingsForDay(day);
              const hasBookings = dayBookings.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`h-10 lg:h-14 rounded-lg text-sm relative flex flex-col items-center justify-center transition-colors
                    ${isSelected ? "bg-primary text-primary-foreground" : ""}
                    ${isToday(day) && !isSelected ? "bg-accent font-bold" : ""}
                    ${isPast ? "text-muted-foreground/50" : ""}
                    ${!isSelected && !isToday(day) ? "hover:bg-muted" : ""}
                  `}
                >
                  <span>{format(day, "d")}</span>
                  {hasBookings && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayBookings.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? "bg-primary-foreground" : "bg-primary"}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Bookings */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {format(selectedDate, "dd 'de' MMMM, EEEE", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedDayBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento neste dia</p>
            ) : (
              selectedDayBookings.map((b) => (
                <BookingCard key={b.id} booking={b} userId={user?.id} role={role} onCancel={handleCancel} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bookings List */}
      <div>
        <h2 className="text-sm font-semibold mb-2">Próximos Agendamentos</h2>
        <div className="space-y-2">
          {activeBookings
            .filter((b) => new Date(b.data_inicio) >= startOfDay(new Date()))
            .slice(0, 10)
            .map((b) => (
              <BookingCard key={b.id} booking={b} userId={user?.id} role={role} onCancel={handleCancel} />
            ))}
          {activeBookings.filter((b) => new Date(b.data_inicio) >= startOfDay(new Date())).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum agendamento futuro</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BookingCard: React.FC<{
  booking: any;
  userId?: string;
  role: string | null;
  onCancel: (id: string) => void;
}> = ({ booking, userId, role, onCancel }) => {
  const inicio = new Date(booking.data_inicio);
  const fim = new Date(booking.data_fim);
  const canCancel = (booking.motorista_id === userId || role === "admin") && booking.status === "agendado";
  const vehicleName = booking.vehicles ? (booking.vehicles.prefixo || booking.vehicles.placa) : "?";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
          <Car className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold truncate">{vehicleName}</p>
            <Badge className={statusColors[booking.status]}>{statusLabels[booking.status]}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{booking.motorista_nome || "?"}</span>
            {booking.motorista_setor && <span className="text-muted-foreground/70">• {booking.motorista_setor}</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{format(inicio, "dd/MM HH:mm")} — {format(fim, "dd/MM HH:mm")}</span>
          </div>
          {booking.destino && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{booking.destino}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{booking.motivo}</p>
          {canCancel && (
            <Button variant="outline" size="sm" className="h-7 text-xs mt-1" onClick={() => onCancel(booking.id)}>
              <X className="w-3 h-3 mr-1" /> Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Bookings;
