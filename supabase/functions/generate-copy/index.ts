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
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { lead } = await req.json();

    if (!lead || !lead.business_name) {
      return new Response(
        JSON.stringify({ error: "Lead data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um copywriter especialista em vendas B2B para o FlowDrain, uma solução completa de gestão para empresas de desentupimento e serviços hidráulicos.

Sua tarefa é gerar uma mensagem de prospecção personalizada para o lead fornecido. A mensagem deve:
- Ser em português brasileiro
- Ter tom profissional mas amigável
- Mencionar o nome do negócio do lead
- Usar dados reais do lead (avaliações, localização, etc.) para personalizar
- Destacar 3 benefícios chave do FlowDrain para desentupidoras:
  1. Agendamento de serviços automatizado
  2. Controle de ordens de serviço e equipes
  3. CRM e gestão de clientes
- Incluir um call-to-action para uma demonstração gratuita de 15 minutos
- Ter no máximo 200 palavras
- NÃO usar emojis excessivos (máximo 3)`;

    const userPrompt = `Gere uma mensagem de prospecção para este lead:
- Nome do negócio: ${lead.business_name}
- Cidade: ${lead.city || "Não informada"}
- Estado: ${lead.state || "Não informado"}
- Rating: ${lead.rating || "N/A"} estrelas
- Total de avaliações: ${lead.total_reviews || 0}
- Categoria: ${lead.category || "Desentupidora"}
- Tem website: ${lead.website_url ? "Sim" : "Não"}
- Tem WhatsApp: ${lead.has_whatsapp ? "Sim" : "Não"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar copy com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ copy: generatedText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-copy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
