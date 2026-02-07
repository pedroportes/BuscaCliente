import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY não configurada no Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    console.log("Payload recebido:", JSON.stringify(payload));

    const { lead, channel = 'whatsapp' } = payload;

    if (!lead) {
      return new Response(
        JSON.stringify({ error: "Objeto 'lead' ausente no payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lead.business_name) {
      return new Response(
        JSON.stringify({ error: "Lead sem nome da empresa (business_name)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isWhatsApp = channel === 'whatsapp';

    const systemPrompt = isWhatsApp
      ? `Você é um copywriter especialista em vendas B2B para o BuscaCliente, uma solução completa de gestão para empresas de desentupimento e serviços hidráulicos.
        Sua tarefa é gerar uma mensagem de prospecção CURTA e direta para WhatsApp.
        - Ser em português brasileiro.
        - Saudação amigável.
        - Ser muito breve (máximo 3 parágrafos curtos).
        - Mencionar Google Maps.
        - CRÍTICO: Nunca use 'FlowDrain'. Use EXCLUSIVAMENTE 'BuscaCliente'.`
      : `Você é um copywriter especialista em vendas B2B para o BuscaCliente.
        Sua tarefa é gerar um e-mail de prospecção detalhado.
        - CRÍTICO: Nunca use 'FlowDrain'. Use EXCLUSIVAMENTE 'BuscaCliente'.`;

    const userPrompt = `Gere copy para: ${lead.business_name}. Cidade: ${lead.city || 'N/A'}. Categoria: ${lead.category || 'Desentupidora'}.`;

    console.log(`Chamando Gateway AI para ${lead.business_name}...`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Erro na API de IA (${response.status}): ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "Erro ao extrair resposta da IA.";

    return new Response(
      JSON.stringify({ copy: generatedText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Critical error in generate-copy:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno na Edge Function" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
