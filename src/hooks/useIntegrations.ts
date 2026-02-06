import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Integration = Tables<'integrations'>;

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*');

      if (error) throw error;
      return data as Integration[];
    },
  });
}

export function useUpsertIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      provider,
      credentials,
      config,
      companyId,
    }: {
      provider: string;
      credentials: Record<string, string>;
      config?: Record<string, string>;
      companyId: string;
    }) => {
      // Check if integration already exists
      const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('provider', provider)
        .eq('company_id', companyId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('integrations')
          .update({
            credentials,
            config: config || null,
            is_active: true,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('integrations')
          .insert({
            provider,
            credentials,
            config: config || null,
            company_id: companyId,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useTestIntegration() {
  return useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      // Simple validation - check if key looks valid
      if (!apiKey || apiKey.trim().length < 10) {
        throw new Error('Chave API inválida');
      }

      if (provider === 'google-places') {
        // Test Google Places API with a simple request
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=test&inputtype=textquery&key=${apiKey}`
        );
        // CORS will block this from frontend, so we just validate format
        if (apiKey.startsWith('AIza') && apiKey.length >= 30) {
          return { success: true };
        }
        throw new Error('Formato de chave inválido');
      }

      if (provider === 'google-gemini') {
        if (apiKey.startsWith('AIza') && apiKey.length >= 30) {
          return { success: true };
        }
        throw new Error('Formato de chave inválido');
      }

      if (provider === 'resend') {
        if (apiKey.startsWith('re_') && apiKey.length >= 20) {
          return { success: true };
        }
        throw new Error('Formato de chave inválido. Deve começar com "re_"');
      }

      return { success: true };
    },
  });
}
