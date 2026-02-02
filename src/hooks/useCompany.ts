import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Company = Tables<'companies'>;

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*');

      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompanyCredits() {
  return useQuery({
    queryKey: ['company-credits'],
    queryFn: async () => {
      // Para simplificar, pega a primeira empresa (ou a default)
      const { data, error } = await supabase
        .from('companies')
        .select('credits_remaining')
        .limit(1)
        .single();

      if (error) throw error;
      return data?.credits_remaining || 0;
    },
  });
}
