import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Lead = Tables<'leads'>;

export function useLeads(campaignId?: string) {
  return useQuery({
    queryKey: ['leads', campaignId],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignId && campaignId !== 'all') {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useLeadsCount() {
  return useQuery({
    queryKey: ['leads-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useQualifiedLeadsCount() {
  return useQuery({
    queryKey: ['qualified-leads-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('stage', ['qualified', 'proposal', 'won']);

      if (error) throw error;
      return count || 0;
    },
  });
}

export function useLeadsChartData() {
  return useQuery({
    queryKey: ['leads-chart'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group leads by date
      const grouped = (data || []).reduce((acc: Record<string, number>, lead) => {
        const date = new Date(lead.created_at!).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([date, leads]) => ({
        date,
        leads,
      }));
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
