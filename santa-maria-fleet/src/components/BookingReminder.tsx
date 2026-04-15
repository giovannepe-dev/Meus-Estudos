import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { CalendarDays, Bell } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const BookingReminder: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;
    checkReminders();
    const interval = setInterval(checkReminders, 60000); // check every minute
    return () => clearInterval(interval);
  }, [user]);

  const checkReminders = async () => {
    if (!user) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Bookings for tomorrow (not yet notified for vespera) OR today (not yet notified for dia)
    const { data } = await supabase
      .from("vehicle_bookings")
      .select("*, vehicles(placa, prefixo, marca, modelo)")
      .eq("motorista_id", user.id)
      .in("status", ["agendado", "confirmado"])
      .eq("ciente", false);

    if (!data || data.length === 0) return;

    const pending: any[] = [];

    for (const b of data) {
      const bookingDate = new Date(b.data_inicio);
      const bookingDayStart = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

      // Tomorrow reminder
      if (bookingDayStart.getTime() === tomorrowStart.getTime() && !b.notificado_vespera) {
        pending.push({ ...b, reminderType: "vespera" });
      }
      // Today reminder
      if (bookingDayStart.getTime() === todayStart.getTime() && !b.notificado_dia) {
        pending.push({ ...b, reminderType: "dia" });
      }
    }

    if (pending.length > 0) {
      setReminders(pending);
      setCurrentIndex(0);
      playSound();
    }
  };

  const playSound = () => {
    try {
      // Use Web Audio API for notification sound
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => {
        osc.frequency.value = 1000;
        setTimeout(() => {
          osc.frequency.value = 800;
          setTimeout(() => {
            osc.stop();
            ctx.close();
          }, 200);
        }, 200);
      }, 200);
    } catch (e) {
      // Silently fail if audio not available
    }
  };

  const handleAcknowledge = async () => {
    const current = reminders[currentIndex];
    if (!current) return;

    if (current.reminderType === "vespera") {
      await supabase.from("vehicle_bookings").update({ notificado_vespera: true }).eq("id", current.id);
    } else {
      await supabase.from("vehicle_bookings").update({ notificado_dia: true, ciente: true }).eq("id", current.id);
    }

    if (currentIndex < reminders.length - 1) {
      setCurrentIndex(currentIndex + 1);
      playSound();
    } else {
      setReminders([]);
      setCurrentIndex(0);
    }
  };

  const current = reminders[currentIndex];
  if (!current) return null;

  const inicio = new Date(current.data_inicio);
  const vehicleName = current.vehicles ? (current.vehicles.prefixo || current.vehicles.placa) : "?";
  const isToday = current.reminderType === "dia";

  return (
    <AlertDialog open={reminders.length > 0}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary animate-bounce" />
            {isToday ? "🔔 Agendamento HOJE!" : "📅 Lembrete de Agendamento (Amanhã)"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-lg bg-accent">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{vehicleName}</span>
                </div>
                <p className="text-sm text-foreground mb-1">
                  📋 {current.motivo}
                </p>
                {current.destino && (
                  <p className="text-sm text-muted-foreground">📍 {current.destino}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  🕐 {format(inicio, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {isToday && (
                <p className="text-sm text-warning font-medium">
                  ⚠️ Seu agendamento é HOJE. Prepare-se para a retirada do veículo.
                </p>
              )}
              {reminders.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  {currentIndex + 1} de {reminders.length} lembretes
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAcknowledge}>
            ✅ Ciente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
