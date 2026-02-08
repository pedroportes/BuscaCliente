import { Card } from '@/components/ui/card';
import { UserPlus, CheckCircle, Mail, Star, FileText, Loader2 } from 'lucide-react';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

const activityIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  lead_added: { icon: UserPlus, color: 'text-primary', bg: 'bg-primary/10' },
  campaign_completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  email_sent: { icon: Mail, color: 'text-accent', bg: 'bg-accent/10' },
  lead_qualified: { icon: Star, color: 'text-warning', bg: 'bg-warning/10' },
  note_added: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function RecentActivity() {
  const { data: activities, isLoading } = useRecentActivity();

  return (
    <Card className="p-6 bg-card border-0 shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Atividade Recente</h3>
        <p className="text-sm text-muted-foreground">Últimas atualizações</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {(activities || []).map((activity, index) => {
            const config = activityIcons[activity.type] || activityIcons.lead_added;
            const Icon = config.icon;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-card-foreground truncate">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            );
          })}

          {(!activities || activities.length === 0) && (
            <EmptyState
              icon={FileText}
              title="Sem atividades"
              description="As atividades recentes aparecerão aqui"
              className="py-4"
            />
          )}
        </div>
      )}
    </Card>
  );
}
