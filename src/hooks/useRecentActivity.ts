import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Activity {
  id: string;
  type: string;
  message: string;
  time: string;
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          id,
          activity_type,
          metadata,
          created_at,
          lead:leads(business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const activities: Activity[] = (data || []).map((activity) => {
        const leadName = (activity.lead as any)?.business_name || 'Lead';
        const metadata = activity.metadata as Record<string, any> | null;

        let message = '';
        let type = activity.activity_type;

        switch (activity.activity_type) {
          case 'created':
            message = `Novo lead: ${leadName}`;
            type = 'lead_added';
            break;
          case 'stage_change':
            message = `${leadName} movido para ${metadata?.new_stage || 'novo estágio'}`;
            type = 'lead_qualified';
            break;
          case 'note_added':
            message = `Nota adicionada em ${leadName}`;
            type = 'note_added';
            break;
          case 'email_sent':
            message = `Email enviado para ${leadName}`;
            type = 'email_sent';
            break;
          default:
            message = `Atividade em ${leadName}`;
        }

        return {
          id: activity.id,
          type,
          message,
          time: formatRelativeTime(activity.created_at!),
        };
      });

      return activities;
    },
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
  if (diffDays === 1) return 'Ontem';
  return `${diffDays} dias atrás`;
}
