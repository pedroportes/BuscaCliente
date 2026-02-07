
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- campaigns
DROP POLICY IF EXISTS "Authenticated company access - campaigns" ON public.campaigns;
CREATE POLICY "Company access - campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- leads
DROP POLICY IF EXISTS "Authenticated company access - leads" ON public.leads;
CREATE POLICY "Company access - leads" ON public.leads
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- companies
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- lead_activities
DROP POLICY IF EXISTS "Authenticated company access - lead_activities" ON public.lead_activities;
CREATE POLICY "Company access - lead_activities" ON public.lead_activities
  FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- lead_notes
DROP POLICY IF EXISTS "Authenticated company access - lead_notes" ON public.lead_notes;
CREATE POLICY "Company access - lead_notes" ON public.lead_notes
  FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- lead_sequences
DROP POLICY IF EXISTS "Authenticated company access - lead_sequences" ON public.lead_sequences;
CREATE POLICY "Company access - lead_sequences" ON public.lead_sequences
  FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- lead_tag_assignments
DROP POLICY IF EXISTS "Authenticated company access - lead_tag_assignments" ON public.lead_tag_assignments;
CREATE POLICY "Company access - lead_tag_assignments" ON public.lead_tag_assignments
  FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- lead_tags
DROP POLICY IF EXISTS "Authenticated company access - lead_tags" ON public.lead_tags;
CREATE POLICY "Company access - lead_tags" ON public.lead_tags
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- messages
DROP POLICY IF EXISTS "Authenticated company access - messages" ON public.messages;
CREATE POLICY "Company access - messages" ON public.messages
  FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- integrations
DROP POLICY IF EXISTS "Authenticated company access - integrations" ON public.integrations;
CREATE POLICY "Company access - integrations" ON public.integrations
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- email_sequences
DROP POLICY IF EXISTS "Authenticated company access - email_sequences" ON public.email_sequences;
CREATE POLICY "Company access - email_sequences" ON public.email_sequences
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- email_templates
DROP POLICY IF EXISTS "Authenticated company access - email_templates" ON public.email_templates;
CREATE POLICY "Company access - email_templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- engagement_sequences
DROP POLICY IF EXISTS "Authenticated company access - engagement_sequences" ON public.engagement_sequences;
CREATE POLICY "Company access - engagement_sequences" ON public.engagement_sequences
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- invoices
DROP POLICY IF EXISTS "Authenticated company access - invoices" ON public.invoices;
CREATE POLICY "Company access - invoices" ON public.invoices
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- sequence_steps
DROP POLICY IF EXISTS "Authenticated company access - sequence_steps" ON public.sequence_steps;
CREATE POLICY "Company access - sequence_steps" ON public.sequence_steps
  FOR ALL TO authenticated
  USING (sequence_id IN (SELECT id FROM email_sequences WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (sequence_id IN (SELECT id FROM email_sequences WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- system_logs
DROP POLICY IF EXISTS "Authenticated company access - system_logs" ON public.system_logs;
CREATE POLICY "Company access - system_logs" ON public.system_logs
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- tags
DROP POLICY IF EXISTS "Authenticated company access - tags" ON public.tags;
CREATE POLICY "Company access - tags" ON public.tags
  FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- profiles (keep existing but ensure PERMISSIVE)
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service role can insert profiles" ON public.profiles
  FOR INSERT
  WITH CHECK (true);
