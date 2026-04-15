import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface WhatsAppShareProps {
  defaultMessage?: string;
  buttonLabel?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'icon';
  className?: string;
}

export const WhatsAppShare: React.FC<WhatsAppShareProps> = ({
  defaultMessage = '',
  buttonLabel,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  className,
}) => {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(defaultMessage);
  const [open, setOpen] = useState(false);

  const sendWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(message);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setMessage(defaultMessage); }}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className={className}>
          <MessageCircle className="h-4 w-4" />
          {buttonLabel && <span className="ml-1.5">{buttonLabel}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Enviar via WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Número (opcional, com DDD)</Label>
            <Input
              placeholder="5511999999999"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              Deixe vazio para escolher o contato no WhatsApp
            </p>
          </div>
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
            />
          </div>
          <Button onClick={sendWhatsApp} className="w-full gap-2 bg-[#25D366] hover:bg-[#1DA851] text-white">
            <MessageCircle className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
