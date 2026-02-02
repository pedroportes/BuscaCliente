import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Message = Tables<'messages'> & {
  lead?: Tables<'leads'> | null;
};

export function useMessages() {
  return useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          lead:leads(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    },
  });
}

export function useMessageStats() {
  return useQuery({
    queryKey: ['message-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('status');

      if (error) throw error;

      const messages = data || [];
      const totalSent = messages.filter(m => ['sent', 'delivered', 'read'].includes(m.status || '')).length;
      const delivered = messages.filter(m => m.status === 'delivered' || m.status === 'read').length;
      const pending = messages.filter(m => m.status === 'pending' || m.status === 'scheduled').length;
      const failed = messages.filter(m => m.status === 'failed').length;
      const read = messages.filter(m => m.status === 'read').length;

      return {
        totalSent,
        delivered,
        pending,
        failed,
        readRate: totalSent > 0 ? Math.round((read / totalSent) * 100 * 10) / 10 : 0,
        responseRate: delivered > 0 ? Math.round((read / delivered) * 100 * 10) / 10 : 0,
      };
    },
  });
}
