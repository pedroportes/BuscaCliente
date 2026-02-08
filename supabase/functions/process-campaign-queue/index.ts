
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        console.log("Starting process-campaign-queue...");

        // 1. Check Daily Limit (99 emails/day)
        const todayFullStr = new Date().toISOString(); // e.g. 2024-01-01T15:00:00.000Z
        const todayStr = todayFullStr.split('T')[0]; // 2024-01-01 UTC

        const { count: sentToday, error: countError } = await supabase
            .from("campaign_queue")
            .select("*", { count: "exact", head: true })
            .gte("sent_at", `${todayStr}T00:00:00.000Z`)
            .eq("status", "sent");

        if (countError) {
            console.error("Error checking limit:", countError);
            throw countError;
        }

        const DAILY_LIMIT = 99;
        console.log(`Emails sent today: ${sentToday}/${DAILY_LIMIT}`);

        if ((sentToday || 0) >= DAILY_LIMIT) {
            console.log("Daily limit reached. Stopping execution.");
            return new Response(
                JSON.stringify({
                    message: "Daily limit reached",
                    sentToday,
                    limit: DAILY_LIMIT
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 2. Fetch Pending Items
        // Limit batch size to 10 to distribute sending over the day and avoid timeouts
        const BATCH_SIZE = 10;

        // We select items scheduled for now or in the past
        // Using a simple query. Complex queries might require rpc if relational filtering is needed,
        // but here we filter by campaign_queue fields.
        const { data: queueItems, error: fetchError } = await supabase
            .from("campaign_queue")
            .select(`
        id, 
        lead_id, 
        leads ( id, email, business_name, company_id, contact_name, owner_id, city ),
        sequence_step_id,
        sequence_steps ( content )
      `)
            .eq("status", "pending")
            .lte("scheduled_for", todayFullStr)
            .limit(BATCH_SIZE);

        if (fetchError) {
            console.error("Error fetching queue:", fetchError);
            throw fetchError;
        }

        if (!queueItems || queueItems.length === 0) {
            console.log("No pending items to process.");
            return new Response(
                JSON.stringify({ message: "No pending items" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Processing batch of ${queueItems.length} items`);

        const results = [];

        // 3. Process Batch
        for (const item of queueItems) {
            // mark as processing to avoid duplicates if verify runs concurrently (unlikely with cron)
            // but good practice.
            // await supabase.from("campaign_queue").update({ status: 'processing' }).eq('id', item.id);

            const lead = item.leads as any;
            const step = item.sequence_steps as any;
            let status = "failed";
            let errorMsg = null;
            let sentAt = null;

            try {
                if (!lead || !lead.email) throw new Error(`Lead missing or no email. LeadID: ${item.lead_id}`);
                if (!step || !step.content) throw new Error("Step content missing");

                // 3.1 Fetch Integration Settings (Resend API Key)
                let resendApiKey = Deno.env.get("RESEND_API_KEY");
                let senderEmail = "onboarding@resend.dev";

                if (lead.company_id) {
                    const { data: integration } = await supabase
                        .from("integrations")
                        .select("credentials, config")
                        .eq("company_id", lead.company_id)
                        .eq("provider", "resend")
                        .eq("is_active", true)
                        .maybeSingle();

                    if (integration) {
                        const creds = integration.credentials as Record<string, string>;
                        const config = integration.config as Record<string, string>;
                        if (creds?.api_key) resendApiKey = creds.api_key;
                        if (config?.sender_email) senderEmail = config.sender_email;
                    }
                }

                if (!resendApiKey) throw new Error("RESEND_API_KEY Missing");

                // 3.2 Prepare Email Content
                // Variable Replacement
                let subject = step.content.subject || "";
                let body = step.content.body || "";

                const contactName = lead.contact_name || "Parceiro";
                const companyName = lead.business_name || "Sua Empresa";
                const city = lead.city || "sua região";

                subject = subject
                    .replace(/{{contact_name}}/g, contactName)
                    .replace(/{{company_name}}/g, companyName)
                    .replace(/{{city}}/g, city);

                body = body
                    .replace(/{{contact_name}}/g, contactName)
                    .replace(/{{company_name}}/g, companyName)
                    .replace(/{{city}}/g, city);

                // Simple HTML Conversion
                const htmlBody = body.split("\n").map((line: string) => `<p>${line || "&nbsp;"}</p>`).join("");

                const finalHtml = `
            <div style="font-family: sans-serif; font-size: 16px; color: #333;">
                ${htmlBody}
                <div style="margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                    <p>Enviado via BuscaCliente</p>
                </div>
            </div>
        `;

                // 3.3 Send via Resend
                const resend = new Resend(resendApiKey);
                const { data: emailData, error: sendError } = await resend.emails.send({
                    from: `BuscaCliente <${senderEmail}>`,
                    to: [lead.email],
                    subject: subject,
                    html: finalHtml,
                });

                if (sendError) {
                    console.error(`Resend Error for ${lead.email}:`, sendError);
                    throw new Error(`Resend: ${sendError.message}`);
                }

                console.log(`Sent to ${lead.email}, ID: ${emailData?.id}`);
                status = "sent";
                sentAt = new Date().toISOString();

            } catch (err: any) {
                console.error(`Failed item ${item.id}:`, err);
                errorMsg = err.message;

                // If critical error (e.g. no API key), maybe stop logic? 
                // No, continue to next item. 
            }

            // 4. Update Queue Item
            // Use logic to NOT retry immediately if failed?
            // For now, if failed, it stays failed. User can retry manually or we have a retry logic later.
            const { error: updateError } = await supabase
                .from("campaign_queue")
                .update({
                    status,
                    sent_at: sentAt,
                    error_message: errorMsg
                })
                .eq("id", item.id);

            if (updateError) console.error("Error updating queue status:", updateError);

            results.push({ id: item.id, status, error: errorMsg });
        }

        return new Response(
            JSON.stringify({
                message: `Processed ${results.length} items`,
                results,
                sentTodayAfter: sentToday + results.filter(r => r.status === 'sent').length
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Critical error in process-campaign-queue:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
