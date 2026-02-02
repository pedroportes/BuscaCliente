import { Card } from '@/components/ui/card';
import { Send, CheckCheck, Clock, X, Eye, TrendingUp } from 'lucide-react';
import { useMessageStats } from '@/hooks/useMessages';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function EngagementMetrics() {
  const { data: stats, isLoading } = useMessageStats();

  const metrics = [
    {
      label: 'Enviadas',
      value: stats?.totalSent ?? 0,
      icon: Send,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Entregues',
      value: stats?.delivered ?? 0,
      icon: CheckCheck,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Pendentes',
      value: stats?.pending ?? 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Falhas',
      value: stats?.failed ?? 0,
      icon: X,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Taxa de Leitura',
      value: `${stats?.readRate ?? 0}%`,
      icon: Eye,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Taxa de Resposta',
      value: `${stats?.responseRate ?? 0}%`,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 bg-card border-0 shadow-md">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

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
