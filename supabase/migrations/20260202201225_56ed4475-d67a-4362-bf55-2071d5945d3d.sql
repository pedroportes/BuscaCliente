-- 1. Remover políticas permissivas de 'leads'
DROP POLICY IF EXISTS "Allow anon read all leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated read all leads" ON public.leads;

-- 2. Remover políticas permissivas de 'companies'
DROP POLICY IF EXISTS "Allow anon read all companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated read all companies" ON public.companies;

-- 3. Remover políticas permissivas de 'campaigns'
DROP POLICY IF EXISTS "Allow anon read all campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow authenticated read all campaigns" ON public.campaigns;

-- 4. Remover políticas permissivas de 'integrations'
DROP POLICY IF EXISTS "Allow anon read integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow anon insert integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow anon update integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow authenticated read integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow authenticated insert integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow authenticated update integrations" ON public.integrations;

-- 5. Habilitar RLS e criar política para 'invoices'
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company isolation - invoices"
ON public.invoices
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- 6. Habilitar RLS nas tabelas que não têm
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de isolamento por empresa para tabelas sem políticas
CREATE POLICY "Company isolation - email_sequences"
ON public.email_sequences
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Company isolation - email_templates"
ON public.email_templates
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Company isolation - engagement_sequences"
ON public.engagement_sequences
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Company isolation - system_logs"
ON public.system_logs
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));