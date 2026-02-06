import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY não está configurada. Configure em Configurações > Integrações." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, subject, body, leadId, leadName }: SendEmailRequest = await req.json();

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
      from: "FlowDrain <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlBody}
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999;">
            Enviado via FlowDrain • Gestão para Desentupidoras
          </p>
        </div>
      `,
    });

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
