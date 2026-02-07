import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  leadId: string;
  leadName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, body, leadId, leadName }: SendEmailRequest = await req.json();

    let resendApiKey = Deno.env.get("RESEND_API_KEY");
    let senderEmail = "onboarding@resend.dev";

    // Tenta buscar configurações da empresa se leadId for fornecido
    if (leadId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Busca company_id do lead
        const { data: lead } = await supabase
          .from("leads")
          .select("company_id")
          .eq("id", leadId)
          .single();

        if (lead?.company_id) {
          // 2. Busca integração ativa do Resend
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

            if (creds?.api_key) {
              resendApiKey = creds.api_key;
              console.log("Usando API Key do banco de dados para Resend");
            }
            if (config?.sender_email) {
              senderEmail = config.sender_email;
              console.log(`Usando remetente personalizado: ${senderEmail}`);
            }
          }
        }
      } catch (dbError) {
        console.error("Erro ao buscar configurações no banco:", dbError);
        // Falha silenciosa, tenta usar env var padrão
      }
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY não encontrada. Configure nas Integrações." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate inputs
    if (!to || !to.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Email do destinatário é obrigatório e deve ser válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subject || subject.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Assunto do email é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body || body.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Corpo do email é obrigatório. Gere uma copy primeiro." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    // Convert plain text body to HTML with line breaks
    const htmlBody = body
      .split("\n")
      .map((line: string) => `<p>${line || "&nbsp;"}</p>`)
      .join("");

    const emailResponse = await resend.emails.send({
      from: `BuscaCliente <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlBody}
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999;">
            Enviado via BuscaCliente • Gestão Inteligente para Especialistas
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error(`Resend error sending to ${to}:`, emailResponse.error);
      return new Response(
        JSON.stringify({ error: `Erro do provedor de email: ${emailResponse.error.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Email sent to ${to} for lead ${leadName} (${leadId}):`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse?.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-email error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao enviar email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
