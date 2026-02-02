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

// Find lead by phone number (try multiple formats)
async function findLeadByPhone(supabase: any, phone: string): Promise<any | null> {
  const normalizedPhone = normalizePhone(phone);
  
  // Try to find with different formats
  const phoneVariants = [
    normalizedPhone,                      // DDD + number (e.g., 41984501037)
    `55${normalizedPhone}`,               // With country code
    normalizedPhone.replace(/^55/, ''),   // Without country code if starts with 55
  ];
  
  for (const variant of phoneVariants) {
    // Search using LIKE to handle different storage formats
    const { data, error } = await supabase
      .from('leads')
      .select('id, business_name, phone, company_id')
      .or(`phone.ilike.%${variant}%,phone.eq.${variant}`)
      .limit(1)
      .single();
    
    if (data && !error) {
      return data;
    }
  }
  
  return null;
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

      // Extract message content
      const messageContent = messageData.message || {};
      let body = '';
      
      // Handle different message types
      if (messageContent.conversation) {
        body = messageContent.conversation;
      } else if (messageContent.extendedTextMessage?.text) {
        body = messageContent.extendedTextMessage.text;
      } else if (messageContent.imageMessage?.caption) {
        body = `[Imagem] ${messageContent.imageMessage.caption}`;
      } else if (messageContent.videoMessage?.caption) {
        body = `[Vídeo] ${messageContent.videoMessage.caption}`;
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
      } else {
        body = JSON.stringify(messageContent).substring(0, 200);
      }

      console.log(`Incoming message from ${phone}: ${body}`);

      // Find lead by phone number
      const lead = await findLeadByPhone(supabase, phone);
      
      if (!lead) {
        console.log(`Lead not found for phone: ${phone}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Lead not found', 
            phone,
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
