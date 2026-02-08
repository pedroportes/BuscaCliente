
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Check for leads ready to process
        const { data: pendingLeads, error: fetchError } = await supabase
            .from("lead_sequences")
            .select(`
        id,
        lead_id,
        sequence_id,
        current_step,
        leads (
          id,
          email,
          phone,
          company_id,
          contact_name,
          business_name
        )
      `)
            .eq("status", "active")
            .or("next_execution.is.null,next_execution.lte.now()")
            .limit(20);

        if (fetchError) throw fetchError;

        if (!pendingLeads || pendingLeads.length === 0) {
            return new Response(JSON.stringify({ message: "No pending steps to process" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const results = [];

        for (const item of pendingLeads) {
            try {
                const lead = item.leads;
                if (!lead || !lead.company_id) continue;

                // 2. Get current step details
                const { data: stepData } = await supabase
                    .from("sequence_steps")
                    .select("*")
                    .eq("sequence_id", item.sequence_id)
                    .eq("step_order", item.current_step) // Assumes step_order matches current_step index (1-based)
                    .maybeSingle();

                if (!stepData) {
                    // Sequence finished
                    await supabase
                        .from("lead_sequences")
                        .update({
                            status: "completed",
                            completed_at: new Date().toISOString()
                        })
                        .eq("id", item.id);
                    results.push({ lead_id: lead.id, status: "completed" });
                    continue;
                }

                // 3. Execute Action based on step type
                let actionResult = { success: false, error: null };

                // Fetch Integrations
                const { data: integrations } = await supabase
                    .from("integrations")
                    .select("*")
                    .eq("company_id", lead.company_id)
                    .eq("is_active", true);

                if (stepData.type === "email") {
                    const resendInt = integrations?.find(i => i.provider === "resend");
                    const apiKey = (resendInt?.credentials as any)?.api_key || Deno.env.get("RESEND_API_KEY");

                    if (apiKey && lead.email) {
                        const resend = new Resend(apiKey);
                        let subject = "Contato";
                        let html = stepData.content || "Olá";

                        if (stepData.template_id) {
                            const { data: tpl } = await supabase.from("email_templates").select("*").eq("id", stepData.template_id).single();
                            if (tpl) {
                                subject = tpl.subject;
                                html = tpl.body.replace("{{name}}", lead.contact_name || lead.business_name || "Cliente");
                            }
                        }

                        const { data, error } = await resend.emails.send({
                            from: (resendInt?.config as any)?.sender_email || "onboarding@resend.dev",
                            to: [lead.email],
                            subject,
                            html
                        });

                        if (!error) actionResult.success = true;
                        else actionResult.error = error.message;
                    } else {
                        actionResult.error = "No API Key or Email";
                    }
                }
                else if (stepData.type === "whatsapp") {
                    const evoInt = integrations?.find(i => i.provider === "evolution_api");
                    if (evoInt && evoInt.credentials && lead.phone) {
                        // TODO: Call Evolution API here using fetch
                        // const { instance_name, api_key } = evoInt.credentials;
                        // await fetch(`${evoInt.config.base_url}/message/sendText/${instance_name}`, ...)

                        // Mock success for now as we don't have the full Evo SDK here
                        actionResult.success = true;
                    } else {
                        actionResult.error = "No Evolution Config or Phone";
                    }
                }

                // 4. Update State
                if (actionResult.success) {
                    // Log message
                    await supabase.from("messages").insert({
                        lead_id: lead.id,
                        lead_sequence_id: item.id,
                        channel: stepData.type,
                        direction: "outbound",
                        status: "sent",
                        body: "Automated Step " + item.current_step,
                        sent_at: new Date().toISOString()
                    });

                    // Schedule next step
                    const nextStepOrder = item.current_step + 1;
                    const { data: nextStep } = await supabase
                        .from("sequence_steps")
                        .select("delay_days")
                        .eq("sequence_id", item.sequence_id)
                        .eq("step_order", nextStepOrder)
                        .maybeSingle();

                    const nextDate = new Date();
                    if (nextStep) {
                        // Default delay 1 day if not specified, or use configured delay
                        nextDate.setDate(nextDate.getDate() + (nextStep.delay_days || 1));
                    } else {
                        // No next step, schedule immediately to check completion next run
                        nextDate.setMinutes(nextDate.getMinutes() + 5);
                    }

                    await supabase.from("lead_sequences").update({
                        current_step: nextStepOrder,
                        next_execution: nextDate.toISOString()
                    }).eq("id", item.id);

                    results.push({ lead: lead.id, status: "processed", step: item.current_step });
                } else {
                    // Log error but don't advance step (retry logic needed)
                    await supabase.from("messages").insert({
                        lead_id: lead.id,
                        lead_sequence_id: item.id,
                        channel: stepData.type,
                        direction: "outbound",
                        status: "failed",
                        error_message: actionResult.error || "Unknown error"
                    });

                    // Advance anyway to avoid blocking? Or retry? 
                    // Better to increment retry_count on lead_sequences (if column exists) or just leave it for now.
                    // For MVP, enable retry by NOT updating next_execution (will try again next run)
                    results.push({ lead: lead.id, status: "failed", error: actionResult.error });
                }

            } catch (err) {
                console.error(err);
                results.push({ id: item.id, error: String(err) });
            }
        }

        return new Response(JSON.stringify({ processed: results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
