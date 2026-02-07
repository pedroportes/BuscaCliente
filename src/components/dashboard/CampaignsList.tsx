import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, MoreVertical, Target, Loader2 } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-muted text-muted-foreground' },
  running: { label: 'Executando', className: 'bg-primary/10 text-primary' },
  completed: { label: 'Concluída', className: 'bg-success/10 text-success' },
  paused: { label: 'Pausada', className: 'bg-warning/10 text-warning' },
};

export function CampaignsList() {
  const { data: campaigns, isLoading } = useCampaigns();

  return (
    <Card className="p-6 bg-card border-0 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Campanhas Ativas</h3>
          <p className="text-sm text-muted-foreground">Gerencie suas buscas de leads</p>
        </div>
        <Button asChild className="gradient-primary shadow-glow">
          <Link to="/campaigns/new">
            <Target className="w-4 h-4 mr-2" />
            Nova Campanha
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          {(campaigns || []).slice(0, 5).map((campaign, index) => {
            const status = campaign.status || 'draft';
            const config = statusConfig[status] || statusConfig.draft;

            return (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Link
                      to={`/leads?campaign=${campaign.id}`}
                      className="font-medium text-card-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      {campaign.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {campaign.search_location} • {campaign.total_leads || 0} leads
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={cn("rounded-full px-3", config.className)}>
                    {config.label}
                  </Badge>

                  {status === 'running' ? (
                    <Button variant="ghost" size="icon" className="text-warning">
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : status === 'draft' && (
                    <Button variant="ghost" size="icon" className="text-success">
                      <Play className="w-4 h-4" />
                    </Button>
                  )}

                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            );
          })}

          {(!campaigns || campaigns.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma campanha encontrada
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
