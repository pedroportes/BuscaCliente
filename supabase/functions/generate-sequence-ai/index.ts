
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SEQUENCE_PROMPT } from "./prompt.ts";

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
                JSON.stringify({ error: "LOVABLE_API_KEY não configurada." }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const payload = await req.json();
        const { niche = "Geral", audience = "Donos de Empresas", tone = "Profissional" } = payload;

        // 1. Preparar o Prompt
        let prompt = SEQUENCE_PROMPT
            .replace("{{niche}}", niche)
            .replace("{{audience}}", audience)
            .replace("{{tone}}", tone);

        console.log("Gerando sequência para:", { niche, audience });

        // 2. Chamar OpenAI/Gemini via Lovable Gateway
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp",
                messages: [
                    {
                        role: "system",
                        content: "Você é um assistente JSON. Retorne apenas JSON puro, sem markdown (```json).",
                    },
                    { role: "user", content: prompt },
                ],
                stream: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI Gateway Error:", errorText);
            throw new Error(`Erro na IA: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "[]";

        // 3. Limpeza de Markdown (caso o modelo envie ```json ... ```)
        content = content.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

        let sequence = [];
        try {
            sequence = JSON.parse(content);
        } catch (parseError) {
            console.error("Erro ao fazer parse do JSON da IA:", content);
            throw new Error("A IA não retornou um JSON válido.");
        }

        return new Response(
            JSON.stringify({ sequence }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Erro na função generate-sequence-ai:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
