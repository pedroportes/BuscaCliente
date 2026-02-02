-- =====================================================
-- FIX ALL RLS POLICIES TO REQUIRE AUTHENTICATION
-- =====================================================
-- The issue is that RESTRICTIVE policies alone don't block unauthenticated access
-- We need PERMISSIVE policies that require auth.uid() IS NOT NULL

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Drop existing policies and recreate with proper auth checks
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Recreate with PERMISSIVE and proper checks
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view own company data" ON public.companies;

CREATE POLICY "Users can view own company data"
ON public.companies FOR SELECT
TO authenticated
USING (id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- LEADS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - leads" ON public.leads;

CREATE POLICY "Company isolation - leads"
ON public.leads FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- CAMPAIGNS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - campaigns" ON public.campaigns;

CREATE POLICY "Company isolation - campaigns"
ON public.campaigns FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - messages" ON public.messages;

CREATE POLICY "Company isolation - messages"
ON public.messages FOR ALL
TO authenticated
USING (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
))
WITH CHECK (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- =====================================================
-- INTEGRATIONS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - integrations" ON public.integrations;

CREATE POLICY "Company isolation - integrations"
ON public.integrations FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- INVOICES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - invoices" ON public.invoices;

CREATE POLICY "Company isolation - invoices"
ON public.invoices FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- EMAIL_TEMPLATES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - email_templates" ON public.email_templates;

CREATE POLICY "Company isolation - email_templates"
ON public.email_templates FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- EMAIL_SEQUENCES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - email_sequences" ON public.email_sequences;

CREATE POLICY "Company isolation - email_sequences"
ON public.email_sequences FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- ENGAGEMENT_SEQUENCES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - engagement_sequences" ON public.engagement_sequences;

CREATE POLICY "Company isolation - engagement_sequences"
ON public.engagement_sequences FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- SYSTEM_LOGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - system_logs" ON public.system_logs;

CREATE POLICY "Company isolation - system_logs"
ON public.system_logs FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- LEAD_NOTES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - notes" ON public.lead_notes;

CREATE POLICY "Company isolation - notes"
ON public.lead_notes FOR ALL
TO authenticated
USING (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
))
WITH CHECK (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- =====================================================
-- LEAD_ACTIVITIES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - activities" ON public.lead_activities;

CREATE POLICY "Company isolation - activities"
ON public.lead_activities FOR ALL
TO authenticated
USING (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
))
WITH CHECK (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- =====================================================
-- LEAD_SEQUENCES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - lead_sequences" ON public.lead_sequences;

CREATE POLICY "Company isolation - lead_sequences"
ON public.lead_sequences FOR ALL
TO authenticated
USING (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
))
WITH CHECK (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- =====================================================
-- LEAD_TAGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - tags" ON public.lead_tags;

CREATE POLICY "Company isolation - lead_tags"
ON public.lead_tags FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

-- =====================================================
-- LEAD_TAG_ASSIGNMENTS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - lead_tag_assignments" ON public.lead_tag_assignments;

CREATE POLICY "Company isolation - lead_tag_assignments"
ON public.lead_tag_assignments FOR ALL
TO authenticated
USING (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
))
WITH CHECK (lead_id IN (
  SELECT id FROM leads WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- =====================================================
-- SEQUENCE_STEPS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - sequence_steps" ON public.sequence_steps;

CREATE POLICY "Company isolation - sequence_steps"
ON public.sequence_steps FOR ALL
TO authenticated
USING (sequence_id IN (
  SELECT id FROM email_sequences WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
))
WITH CHECK (sequence_id IN (
  SELECT id FROM email_sequences WHERE company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
));

-- =====================================================
-- TAGS TABLE
-- =====================================================
DROP POLICY IF EXISTS "Company isolation - tags" ON public.tags;

CREATE POLICY "Company isolation - tags"
ON public.tags FOR ALL
TO authenticated
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
))
WITH CHECK (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));