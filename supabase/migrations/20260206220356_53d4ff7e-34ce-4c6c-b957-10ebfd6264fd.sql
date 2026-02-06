
-- Add PERMISSIVE policies requiring authentication for all tables
-- Currently only RESTRICTIVE policies exist, which need a PERMISSIVE base to work correctly

-- leads
CREATE POLICY "Require authentication - leads"
ON public.leads FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- companies
CREATE POLICY "Require authentication - companies"
ON public.companies FOR SELECT TO authenticated
USING (true);

-- campaigns
CREATE POLICY "Require authentication - campaigns"
ON public.campaigns FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- email_sequences
CREATE POLICY "Require authentication - email_sequences"
ON public.email_sequences FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- email_templates
CREATE POLICY "Require authentication - email_templates"
ON public.email_templates FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- engagement_sequences
CREATE POLICY "Require authentication - engagement_sequences"
ON public.engagement_sequences FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- integrations
CREATE POLICY "Require authentication - integrations"
ON public.integrations FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- invoices
CREATE POLICY "Require authentication - invoices"
ON public.invoices FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- lead_activities
CREATE POLICY "Require authentication - lead_activities"
ON public.lead_activities FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- lead_notes
CREATE POLICY "Require authentication - lead_notes"
ON public.lead_notes FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- lead_sequences
CREATE POLICY "Require authentication - lead_sequences"
ON public.lead_sequences FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- lead_tag_assignments
CREATE POLICY "Require authentication - lead_tag_assignments"
ON public.lead_tag_assignments FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- lead_tags
CREATE POLICY "Require authentication - lead_tags"
ON public.lead_tags FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- messages
CREATE POLICY "Require authentication - messages"
ON public.messages FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- profiles
CREATE POLICY "Require authentication - profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- sequence_steps
CREATE POLICY "Require authentication - sequence_steps"
ON public.sequence_steps FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- system_logs
CREATE POLICY "Require authentication - system_logs"
ON public.system_logs FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- tags
CREATE POLICY "Require authentication - tags"
ON public.tags FOR ALL TO authenticated
USING (true) WITH CHECK (true);
