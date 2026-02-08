import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type EngagementSequence = Tables<'engagement_sequences'>;
export type SequenceStep = Tables<'sequence_steps'>;

export function useEngagements() {
    return useQuery({
        queryKey: ['engagement_sequences'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('engagement_sequences')
                .select(`
          *,
          steps:sequence_steps(*)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
    });
}

export function useEngagement(id: string) {
    return useQuery({
        queryKey: ['engagement_sequence', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('engagement_sequences')
                .select(`
          *,
          steps:sequence_steps(*)
        `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });
}
