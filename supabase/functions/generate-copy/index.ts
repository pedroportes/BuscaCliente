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
      ? `Você é a Fabiola, especialista do BuscaCliente, uma solução de gestão para desentupidoras.
         
         REGRAS (WhatsApp):
         - Você está entrando em contato com donos de desentupidoras.
         - Seja breve, amigável e direta.
         - NUNCA use "Assunto:".
         - NUNCA use placeholders como [Nome].
         - Assine apenas como "Fabiola".
         - Texto SEM formatação HTML, apenas quebras de linha.

         ESTRUTURA:
         1. Saudação amigável (ex: "Olá, tudo bem?", "Oi pessoal da [Empresa]").
         2. Elogio rápido à empresa ou região.
         3. Pergunta sobre uma dor comum (ex: gestão de agenda, perda de orçamentos).
         4. Convite para mostrar como o BuscaCliente resolve isso.
         
         CRÍTICO: Nunca use 'FlowDrain'. Use EXCLUSIVAMENTE 'BuscaCliente'.`
      : `Você é a Fabiola, consultora do BuscaCliente.
         
         REGRAS (Email):
         - Escreva um email pessoal, como se fosse enviado do seu Outlook.
         - NUNCA inclua linha de "Assunto:" ou "Subject:" no output. Apenas o corpo.
         - NUNCA use placeholders genéricos como [Nome do Tomador]. Use saudações como "Olá equipe da [Empresa]" ou apenas "Olá".
         - Assine como "Fabiola".
         
         ESTRUTURA:
         1. Saudação simples.
         2. Mencione que encontrou a empresa deles em [Cidade] e achou interessante.
         3. Pergunte como lidam com [Problema: Leads desqualificados / Gestão de técnicos].
         4. Apresente o BuscaCliente em 1 frase (Software de gestão + Captação de clientes).
         5. Convite leve para uma conversa rápida.
         
         CRÍTICO: Nunca use 'FlowDrain'. Use EXCLUSIVAMENTE 'BuscaCliente'. Gere HTML simples (<p>, <br>).`;

    const userPrompt = `Gere uma mensagem para a empresa: ${lead.business_name}
    Cidade: ${lead.city || 'sua região'}
    Categoria: ${lead.category || 'Desentupidora'}
    
    Aja como Fabiola. Seja natural e não pareça um robô.`;

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
