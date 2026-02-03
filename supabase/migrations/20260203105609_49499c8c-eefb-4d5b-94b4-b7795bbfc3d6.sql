-- Move Evolution API integration to the user's actual company
-- First, get the user's company_id and update the integration

-- Update the Evolution API integration to match the user's company
UPDATE public.integrations
SET company_id = (
  SELECT company_id FROM public.profiles 
  WHERE email = 'pedrosportes@gmail.com' 
  LIMIT 1
)
WHERE provider = 'evolution_api' 
  AND company_id = '00000000-0000-0000-0000-000000000001';

-- Move leads that have messages from this integration to the same company
UPDATE public.leads
SET company_id = (
  SELECT company_id FROM public.profiles 
  WHERE email = 'pedrosportes@gmail.com' 
  LIMIT 1
)
WHERE company_id = '00000000-0000-0000-0000-000000000001'
  AND id IN (
    SELECT DISTINCT lead_id FROM public.messages WHERE lead_id IS NOT NULL
  );

-- Update campaigns associated with those leads
UPDATE public.campaigns
SET company_id = (
  SELECT company_id FROM public.profiles 
  WHERE email = 'pedrosportes@gmail.com' 
  LIMIT 1
)
WHERE company_id = '00000000-0000-0000-0000-000000000001';