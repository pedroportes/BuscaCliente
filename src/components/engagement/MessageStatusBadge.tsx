import { Badge } from '@/components/ui/badge';
import { Clock, Send, Check, CheckCheck, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageStatusBadgeProps {
  status: 'pending' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'read';
}

const statusConfig = {
  pending: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-muted text-muted-foreground border-muted',
  },
  scheduled: {
    label: 'Agendado',
    icon: Clock,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  sent: {
    label: 'Enviado',
    icon: Send,
    className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  delivered: {
    label: 'Entregue',
    icon: CheckCheck,
    className: 'bg-success/10 text-success border-success/20',
  },
  failed: {
    label: 'Falhou',
    icon: X,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  read: {
    label: 'Lido',
    icon: Eye,
    className: 'bg-success/20 text-success border-success/30',
  },
};

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center gap-1 font-medium", config.className)}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
