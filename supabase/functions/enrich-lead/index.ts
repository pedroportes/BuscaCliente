import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { lead_id } = await req.json();

        if (!lead_id) {
            return new Response(
                JSON.stringify({ error: 'lead_id is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 1. Fetch lead website
        const { data: lead, error: fetchError } = await supabaseAdmin
            .from('leads')
            .select('website_url, business_name')
            .eq('id', lead_id)
            .single();

        if (fetchError || !lead?.website_url) {
            return new Response(
                JSON.stringify({ error: 'Lead not found or has no website' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`[enrich-lead] Enriching lead: ${lead.business_name} (${lead.website_url})`);

        // 2. Fetch website content
        let html = "";
        try {
            const response = await fetch(lead.website_url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            html = await response.text();
        } catch (err) {
            console.error(`[enrich-lead] Error fetching website:`, err);
            return new Response(
                JSON.stringify({ error: 'Failed to access website' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Simple regex scraping
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const instagramRegex = /instagram\.com\/([a-zA-Z0-9._]+)/i;
        const facebookRegex = /facebook\.com\/([a-zA-Z0-9._]+)/i;

        const emails = html.match(emailRegex) || [];
        const instagramMatch = html.match(instagramRegex);
        const facebookMatch = html.match(facebookRegex);

        // Filter common garbage emails
        const validEmails = emails.filter(e =>
            !e.endsWith('.png') &&
            !e.endsWith('.jpg') &&
            !e.endsWith('.webp') &&
            !e.includes('sentry') &&
            !e.includes('example.com')
        );

        const email = validEmails.length > 0 ? validEmails[0].toLowerCase() : null;
        const instagram_url = instagramMatch ? `https://www.instagram.com/${instagramMatch[1].replace(/\/$/, '')}` : null;
        const facebook_url = facebookMatch ? `https://www.facebook.com/${facebookMatch[1].replace(/\/$/, '')}` : null;

        console.log(`[enrich-lead] Found:`, { email, instagram_url, facebook_url });

        // 4. Update lead
        const updateData: any = {};
        if (email) updateData.email = email;
        if (instagram_url) updateData.instagram_url = instagram_url;
        if (facebook_url) updateData.facebook_url = facebook_url;

        if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabaseAdmin
                .from('leads')
                .update(updateData)
                .eq('id', lead_id);

            if (updateError) {
                throw updateError;
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                found: {
                    email: !!email,
                    instagram: !!instagram_url,
                    facebook: !!facebook_url
                },
                data: updateData
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[enrich-lead] Fatal error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
