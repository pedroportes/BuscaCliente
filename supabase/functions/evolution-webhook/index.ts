import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize phone number to match database format
function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove country code 55 if present
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.substring(2);
  }
  
  return cleaned;
}

// Generate all possible phone variants for matching
function generatePhoneVariants(phone: string): string[] {
  const cleaned = phone.replace(/\D/g, '');
  const variants: string[] = [cleaned];
  
  // Without 55
  if (cleaned.startsWith('55')) {
    variants.push(cleaned.substring(2));
  }
  
  // With 55
  if (!cleaned.startsWith('55')) {
    variants.push(`55${cleaned}`);
  }
  
  // Extract just the last 8-9 digits (number without DDD)
  const lastDigits = cleaned.slice(-9);
  const lastDigits8 = cleaned.slice(-8);
  
  // For each variant, also try with/without the 9 prefix for mobile
  const allVariants = [...variants];
  for (const v of variants) {
    // Get DDD (first 2 digits after removing 55)
    const withoutCountry = v.startsWith('55') ? v.substring(2) : v;
    const ddd = withoutCountry.substring(0, 2);
    const number = withoutCountry.substring(2);
    
    // If number has 9 digits (with 9), try without 9
    if (number.length === 9 && number.startsWith('9')) {
      allVariants.push(`${ddd}${number.substring(1)}`);
      allVariants.push(`55${ddd}${number.substring(1)}`);
    }
    // If number has 8 digits (without 9), try with 9
    if (number.length === 8) {
      allVariants.push(`${ddd}9${number}`);
      allVariants.push(`55${ddd}9${number}`);
    }
  }
  
  // Add last digits variations
  allVariants.push(lastDigits);
  allVariants.push(lastDigits8);
  
  // Remove duplicates
  return [...new Set(allVariants)];
}

// Find lead by phone number (try multiple formats)
async function findLeadByPhone(supabase: any, phone: string, companyId?: string | null): Promise<any | null> {
  const variants = generatePhoneVariants(phone);
  
  console.log(`Searching for phone variants: ${variants.join(', ')}`);
  
  for (const variant of variants) {
    // Search using LIKE to handle different storage formats
    let query = supabase
      .from('leads')
      .select('id, business_name, phone, company_id')
      .or(`phone.ilike.%${variant}%,phone.eq.${variant}`);

    // Enforce tenant isolation (matches RLS used by the frontend)
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.limit(1).single();
    
    if (data && !error) {
      console.log(`Found lead with variant: ${variant}`);
      return data;
    }
  }
  
  return null;
}

async function resolveCompanyIdFromWebhook(supabase: any, payload: any, req: Request): Promise<string | null> {
  const instance = payload?.instance || payload?.data?.instance || payload?.data?.instanceName;

  // Evolution tends to send apikey in the JSON payload; also accept header fallback.
  const apiKey = payload?.apikey || req.headers.get('apikey') || req.headers.get('x-api-key');

  if (!apiKey && !instance) {
    console.log('No apiKey/instance provided by webhook; cannot resolve company_id');
    return null;
  }

  // Try to map webhook to the correct company via integrations
  // credentials format (current): { apiKey, instance, url }
  let q = supabase
    .from('integrations')
    .select('company_id, provider, is_active, credentials')
    .eq('provider', 'evolution_api')
    .eq('is_active', true);

  if (apiKey && instance) {
    q = q.or(`credentials->>apiKey.eq.${apiKey},credentials->>instance.eq.${instance}`);
  } else if (apiKey) {
    q = q.eq('credentials->>apiKey', apiKey);
  } else if (instance) {
    q = q.eq('credentials->>instance', instance);
  }

  const { data, error } = await q.limit(1).maybeSingle();

  if (error) {
    console.error('Error resolving company from integrations:', error);
    return null;
  }

  if (!data?.company_id) {
    console.log('No integration match found for webhook apiKey/instance');
    return null;
  }

  console.log(`Resolved company_id from integration: ${data.company_id}`);
  return data.company_id;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    
    console.log('Evolution API Webhook received:', JSON.stringify(payload, null, 2));

    // Evolution API sends different event types
    const event = payload.event || payload.type;
    const data = payload.data || payload;
    
    // Resolve tenant/company for this webhook event (required for RLS visibility on frontend)
    const companyId = await resolveCompanyIdFromWebhook(supabase, payload, req);

    // Handle incoming messages
    if (event === 'messages.upsert' || event === 'message' || data.message) {
      const messageData = data.message || data;
      const key = data.key || messageData.key || {};
      
      // Only process incoming messages (not sent by us)
      const isFromMe = key.fromMe === true;
      if (isFromMe) {
        console.log('Ignoring outbound message');
        return new Response(
          JSON.stringify({ success: true, ignored: true, reason: 'outbound message' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract phone number from remoteJid
      const remoteJid = key.remoteJid || data.remoteJid || '';
      const phoneMatch = remoteJid.match(/(\d+)@/);
      const phone = phoneMatch ? phoneMatch[1] : '';
      
      if (!phone) {
        console.log('No phone number found in webhook');
        return new Response(
          JSON.stringify({ success: false, error: 'No phone number' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Extract message content - handle nested structure from Evolution API
      const messageContent = messageData.message || data.message || {};
      let body = '';
      
      console.log(`Message content structure: ${JSON.stringify(messageContent)}`);
      
      // Handle different message types
      if (messageContent.conversation) {
        body = messageContent.conversation;
      } else if (typeof messageContent === 'string') {
        body = messageContent;
      } else if (messageContent.extendedTextMessage?.text) {
        body = messageContent.extendedTextMessage.text;
      } else if (messageContent.imageMessage?.caption) {
        body = `[Imagem] ${messageContent.imageMessage.caption || ''}`;
      } else if (messageContent.imageMessage) {
        body = '[Imagem]';
      } else if (messageContent.videoMessage?.caption) {
        body = `[Vídeo] ${messageContent.videoMessage.caption || ''}`;
      } else if (messageContent.videoMessage) {
        body = '[Vídeo]';
      } else if (messageContent.audioMessage) {
        body = '[Áudio]';
      } else if (messageContent.documentMessage) {
        body = `[Documento] ${messageContent.documentMessage.fileName || ''}`;
      } else if (messageContent.stickerMessage) {
        body = '[Sticker]';
      } else if (messageContent.contactMessage) {
        body = `[Contato] ${messageContent.contactMessage.displayName || ''}`;
      } else if (messageContent.locationMessage) {
        body = '[Localização]';
      } else if (Object.keys(messageContent).length > 0) {
        // Try to extract any text content
        const textKeys = ['text', 'body', 'caption', 'content'];
        for (const key of textKeys) {
          if (messageContent[key]) {
            body = messageContent[key];
            break;
          }
        }
        if (!body) {
          body = JSON.stringify(messageContent).substring(0, 200);
        }
      }

      console.log(`Incoming message from ${phone}: "${body}"`);

      // Find lead by phone number (scoped to the resolved company to avoid mismatches across tenants)
      const lead = await findLeadByPhone(supabase, phone, companyId);
      
      if (!lead) {
        console.log(`Lead not found for phone: ${phone}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Lead not found', 
            phone,
            company_id: companyId,
            note: 'Consider creating a new lead for unknown contacts'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      console.log(`Found lead: ${lead.business_name} (${lead.id})`);

      // Extract external message ID for deduplication
      const externalId = key.id || messageData.id || `${Date.now()}`;

      // Check if message already exists (deduplication)
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('external_id', externalId)
        .single();

      if (existingMessage) {
        console.log('Message already exists, skipping');
        return new Response(
          JSON.stringify({ success: true, duplicate: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract timestamp
      const messageTimestamp = messageData.messageTimestamp || data.messageTimestamp;
      const sentAt = messageTimestamp 
        ? new Date(typeof messageTimestamp === 'number' ? messageTimestamp * 1000 : messageTimestamp).toISOString()
        : new Date().toISOString();

      // Save message to database
      const { data: savedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          lead_id: lead.id,
          channel: 'whatsapp',
          direction: 'inbound',
          status: 'delivered',
          body: body,
          external_id: externalId,
          sent_at: sentAt,
          delivered_at: new Date().toISOString(),
          metadata: {
            raw_event: event,
            remote_jid: remoteJid,
            instance: payload.instance || data.instance,
          }
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving message:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Update lead's last_contact_at
      await supabase
        .from('leads')
        .update({ last_contact_at: new Date().toISOString() })
        .eq('id', lead.id);

      console.log(`Message saved: ${savedMessage.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_id: savedMessage.id,
          lead_id: lead.id,
          lead_name: lead.business_name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle status updates
    if (event === 'messages.update' || event === 'message.update') {
      const updates = Array.isArray(data) ? data : [data];
      
      for (const update of updates) {
        const key = update.key || {};
        const externalId = key.id;
        const status = update.status || update.update?.status;
        
        if (externalId && status) {
          let dbStatus = status;
          
          // Map Evolution API status to our status
          if (status === 'DELIVERY_ACK' || status === 3) dbStatus = 'delivered';
          else if (status === 'READ' || status === 4) dbStatus = 'read';
          else if (status === 'PLAYED' || status === 5) dbStatus = 'read';
          
          const updateData: any = { status: dbStatus };
          if (dbStatus === 'delivered') updateData.delivered_at = new Date().toISOString();
          if (dbStatus === 'read') updateData.opened_at = new Date().toISOString();
          
          await supabase
            .from('messages')
            .update(updateData)
            .eq('external_id', externalId);
            
          console.log(`Updated message ${externalId} status to ${dbStatus}`);
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, event: 'status_update' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log unhandled events
    console.log(`Unhandled event type: ${event}`);
    
    return new Response(
      JSON.stringify({ success: true, event, handled: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
