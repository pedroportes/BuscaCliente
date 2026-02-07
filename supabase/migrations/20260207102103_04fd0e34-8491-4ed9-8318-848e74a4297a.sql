
-- ============================================================
-- Fix: Remove redundant RESTRICTIVE "Require authentication" policies
-- and redundant PERMISSIVE "authenticated" policies.
-- Replace with single PERMISSIVE policies TO authenticated 
-- that include company isolation in the USING clause.
-- This eliminates all "USING (true)" warnings.
-- ============================================================

-- Helper: Drop all existing policies for a table
-- We'll recreate them properly

-- ========== CAMPAIGNS ==========
DROP POLICY IF EXISTS "Require authentication - campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Company isolation - campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow authenticated access - campaigns" ON public.campaigns;

CREATE POLICY "Authenticated company access - campaigns"
  ON public.campaigns
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== LEADS ==========
DROP POLICY IF EXISTS "Require authentication - leads" ON public.leads;
DROP POLICY IF EXISTS "Company isolation - leads" ON public.leads;
DROP POLICY IF EXISTS "Allow authenticated access - leads" ON public.leads;

CREATE POLICY "Authenticated company access - leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== INTEGRATIONS ==========
DROP POLICY IF EXISTS "Require authentication - integrations" ON public.integrations;
DROP POLICY IF EXISTS "Company isolation - integrations" ON public.integrations;
DROP POLICY IF EXISTS "Allow authenticated access - integrations" ON public.integrations;

CREATE POLICY "Authenticated company access - integrations"
  ON public.integrations
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== EMAIL_TEMPLATES ==========
DROP POLICY IF EXISTS "Require authentication - email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Company isolation - email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Allow authenticated access - email_templates" ON public.email_templates;

CREATE POLICY "Authenticated company access - email_templates"
  ON public.email_templates
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== EMAIL_SEQUENCES ==========
DROP POLICY IF EXISTS "Require authentication - email_sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Company isolation - email_sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Allow authenticated access - email_sequences" ON public.email_sequences;

CREATE POLICY "Authenticated company access - email_sequences"
  ON public.email_sequences
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== ENGAGEMENT_SEQUENCES ==========
DROP POLICY IF EXISTS "Require authentication - engagement_sequences" ON public.engagement_sequences;
DROP POLICY IF EXISTS "Company isolation - engagement_sequences" ON public.engagement_sequences;
DROP POLICY IF EXISTS "Allow authenticated access - engagement_sequences" ON public.engagement_sequences;

CREATE POLICY "Authenticated company access - engagement_sequences"
  ON public.engagement_sequences
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== INVOICES ==========
DROP POLICY IF EXISTS "Require authentication - invoices" ON public.invoices;
DROP POLICY IF EXISTS "Company isolation - invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated access - invoices" ON public.invoices;

CREATE POLICY "Authenticated company access - invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== SYSTEM_LOGS ==========
DROP POLICY IF EXISTS "Require authentication - system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "Company isolation - system_logs" ON public.system_logs;
DROP POLICY IF EXISTS "Allow authenticated access - system_logs" ON public.system_logs;

CREATE POLICY "Authenticated company access - system_logs"
  ON public.system_logs
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== LEAD_TAGS ==========
DROP POLICY IF EXISTS "Require authentication - lead_tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Company isolation - lead_tags" ON public.lead_tags;
DROP POLICY IF EXISTS "Allow authenticated access - lead_tags" ON public.lead_tags;

CREATE POLICY "Authenticated company access - lead_tags"
  ON public.lead_tags
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== TAGS ==========
DROP POLICY IF EXISTS "Require authentication - tags" ON public.tags;
DROP POLICY IF EXISTS "Company isolation - tags" ON public.tags;
DROP POLICY IF EXISTS "Allow authenticated access - tags" ON public.tags;

CREATE POLICY "Authenticated company access - tags"
  ON public.tags
  FOR ALL
  TO authenticated
  USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- ========== LEAD_ACTIVITIES (via lead_id -> leads.company_id) ==========
DROP POLICY IF EXISTS "Require authentication - lead_activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Company isolation - activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Allow authenticated access - lead_activities" ON public.lead_activities;

CREATE POLICY "Authenticated company access - lead_activities"
  ON public.lead_activities
  FOR ALL
  TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- ========== LEAD_NOTES (via lead_id -> leads.company_id) ==========
DROP POLICY IF EXISTS "Require authentication - lead_notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Company isolation - notes" ON public.lead_notes;
DROP POLICY IF EXISTS "Allow authenticated access - lead_notes" ON public.lead_notes;

CREATE POLICY "Authenticated company access - lead_notes"
  ON public.lead_notes
  FOR ALL
  TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- ========== LEAD_SEQUENCES (via lead_id -> leads.company_id) ==========
DROP POLICY IF EXISTS "Require authentication - lead_sequences" ON public.lead_sequences;
DROP POLICY IF EXISTS "Company isolation - lead_sequences" ON public.lead_sequences;
DROP POLICY IF EXISTS "Allow authenticated access - lead_sequences" ON public.lead_sequences;

CREATE POLICY "Authenticated company access - lead_sequences"
  ON public.lead_sequences
  FOR ALL
  TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- ========== LEAD_TAG_ASSIGNMENTS (via lead_id -> leads.company_id) ==========
DROP POLICY IF EXISTS "Require authentication - lead_tag_assignments" ON public.lead_tag_assignments;
DROP POLICY IF EXISTS "Company isolation - lead_tag_assignments" ON public.lead_tag_assignments;
DROP POLICY IF EXISTS "Allow authenticated access - lead_tag_assignments" ON public.lead_tag_assignments;

CREATE POLICY "Authenticated company access - lead_tag_assignments"
  ON public.lead_tag_assignments
  FOR ALL
  TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- ========== MESSAGES (via lead_id -> leads.company_id) ==========
DROP POLICY IF EXISTS "Require authentication - messages" ON public.messages;
DROP POLICY IF EXISTS "Company isolation - messages" ON public.messages;
DROP POLICY IF EXISTS "Allow authenticated access - messages" ON public.messages;

CREATE POLICY "Authenticated company access - messages"
  ON public.messages
  FOR ALL
  TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- ========== SEQUENCE_STEPS (via sequence_id -> email_sequences.company_id) ==========
DROP POLICY IF EXISTS "Require authentication - sequence_steps" ON public.sequence_steps;
DROP POLICY IF EXISTS "Company isolation - sequence_steps" ON public.sequence_steps;
DROP POLICY IF EXISTS "Allow authenticated access - sequence_steps" ON public.sequence_steps;

CREATE POLICY "Authenticated company access - sequence_steps"
  ON public.sequence_steps
  FOR ALL
  TO authenticated
  USING (sequence_id IN (SELECT id FROM email_sequences WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())))
  WITH CHECK (sequence_id IN (SELECT id FROM email_sequences WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())));

-- ========== PROFILES (special: own profile only) ==========
DROP POLICY IF EXISTS "Require authentication - profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated access - profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service role can insert profiles"
  ON public.profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ========== COMPANIES (special: own company only) ==========
DROP POLICY IF EXISTS "Require authentication - companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company data" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated access - companies" ON public.companies;

CREATE POLICY "Users can view own company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));
