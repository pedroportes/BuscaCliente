-- Corrigir políticas permissivas com USING (true)

-- 1. lead_notes - remover política permissiva e manter isolamento
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.lead_notes;

-- 2. lead_tag_assignments - remover políticas permissivas
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.lead_tag_assignments;
DROP POLICY IF EXISTS "Enable full access for authenticated users on lead_tag_assignme" ON public.lead_tag_assignments;

-- Criar política de isolamento por empresa via lead
CREATE POLICY "Company isolation - lead_tag_assignments"
ON public.lead_tag_assignments
FOR ALL
USING (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- 3. messages - remover políticas permissivas
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.messages;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.messages;

-- 4. tags - remover políticas permissivas
DROP POLICY IF EXISTS "Enable all for authenticated" ON public.tags;
DROP POLICY IF EXISTS "Enable full access for authenticated users on tags" ON public.tags;

-- Criar política de isolamento por empresa
CREATE POLICY "Company isolation - tags"
ON public.tags
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- 5. leads - remover política permissiva de update
DROP POLICY IF EXISTS "Enable update for default company" ON public.leads;

-- 6. Criar políticas para tabelas que ficaram sem (lead_sequences, sequence_steps)
CREATE POLICY "Company isolation - lead_sequences"
ON public.lead_sequences
FOR ALL
USING (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

CREATE POLICY "Company isolation - sequence_steps"
ON public.sequence_steps
FOR ALL
USING (sequence_id IN (
  SELECT id FROM email_sequences WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- 7. Corrigir functions com search_path mutável
CREATE OR REPLACE FUNCTION public.log_lead_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO lead_activities (lead_id, user_id, activity_type, metadata)
  VALUES (NEW.id, auth.uid(), 'created', jsonb_build_object('campaign_id', NEW.campaign_id));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_campaign_lead_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE campaigns 
    SET total_leads = total_leads + 1,
        qualified_leads = qualified_leads + CASE WHEN NEW.lead_score >= 70 THEN 1 ELSE 0 END
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.lead_score < 70 AND NEW.lead_score >= 70 THEN
      UPDATE campaigns SET qualified_leads = qualified_leads + 1 WHERE id = NEW.campaign_id;
    ELSIF OLD.lead_score >= 70 AND NEW.lead_score < 70 THEN
      UPDATE campaigns SET qualified_leads = qualified_leads - 1 WHERE id = NEW.campaign_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;