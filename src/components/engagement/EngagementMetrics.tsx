import { Card } from '@/components/ui/card';
import { Send, CheckCheck, Clock, X, Eye, TrendingUp } from 'lucide-react';
import { mockEngagementMetrics } from '@/data/mockMessages';
import { cn } from '@/lib/utils';

export function EngagementMetrics() {
  const metrics = [
    {
      label: 'Enviadas',
      value: mockEngagementMetrics.totalSent,
      icon: Send,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Entregues',
      value: mockEngagementMetrics.delivered,
      icon: CheckCheck,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Pendentes',
      value: mockEngagementMetrics.pending,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Falhas',
      value: mockEngagementMetrics.failed,
      icon: X,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Taxa de Leitura',
      value: `${mockEngagementMetrics.readRate}%`,
      icon: Eye,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Taxa de Resposta',
      value: `${mockEngagementMetrics.responseRate}%`,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-4 bg-card border-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", metric.bgColor)}>
              <metric.icon className={cn("w-5 h-5", metric.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
