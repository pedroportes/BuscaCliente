import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PlaceResult {
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  primaryType?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!GOOGLE_PLACES_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const body = await req.json();
    const { campaign_id, company_id, search_location, search_niches, max_results } = body;

    if (!search_location || !search_niches || search_niches.length === 0) {
      return new Response(
        JSON.stringify({ error: 'search_location and search_niches are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[search-leads] Starting search: ${search_niches.join(', ')} in ${search_location}`);

    const allPlaces: PlaceResult[] = [];
    const limit = max_results || 20;

    // Search for each niche
    for (const niche of search_niches) {
      const query = `${niche} em ${search_location}`;
      console.log(`[search-leads] Searching: "${query}"`);

      try {
        const searchResponse = await fetch(
          'https://places.googleapis.com/v1/places:searchText',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
              'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.rating,places.userRatingCount,places.location,places.primaryType',
            },
            body: JSON.stringify({
              textQuery: query,
              maxResultCount: Math.min(limit, 20),
              languageCode: 'pt-BR',
            }),
          }
        );

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          console.error(`[search-leads] Google API error for "${niche}": ${searchResponse.status} - ${errorText}`);
          continue;
        }

        const searchData = await searchResponse.json();
        const places = searchData.places || [];
        console.log(`[search-leads] Found ${places.length} results for "${niche}"`);
        allPlaces.push(...places);
      } catch (err) {
        console.error(`[search-leads] Error searching "${niche}":`, err);
      }
    }

    if (allPlaces.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          leads_found: 0, 
          leads_saved: 0,
          message: 'Nenhum resultado encontrado para essa busca' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate by googleMapsUri
    const uniquePlaces = new Map<string, PlaceResult>();
    for (const place of allPlaces) {
      const key = place.googleMapsUri || place.displayName?.text || '';
      if (key && !uniquePlaces.has(key)) {
        uniquePlaces.set(key, place);
      }
    }

    console.log(`[search-leads] ${uniquePlaces.size} unique places after dedup`);

    // Parse city/state from location
    const locationParts = search_location.split(',').map(p => p.trim());
    const city = locationParts[0] || null;
    const state = locationParts[1] || null;

    // Build leads for Supabase
    const leads = Array.from(uniquePlaces.values()).map(place => ({
      business_name: place.displayName?.text || 'Sem nome',
      full_address: place.formattedAddress || null,
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
      website_url: place.websiteUri || null,
      google_maps_url: place.googleMapsUri || null,
      rating: place.rating || null,
      total_reviews: place.userRatingCount || 0,
      latitude: place.location?.latitude || null,
      longitude: place.location?.longitude || null,
      city,
      state,
      category: search_niches[0] || null,
      source: 'google_maps',
      stage: 'new',
      campaign_id: campaign_id || null,
      company_id: company_id || null,
    }));

    // Save to Supabase using service role (bypass RLS)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let savedCount = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        // Check if lead already exists by google_maps_url
        if (lead.google_maps_url) {
          const { data: existing } = await supabaseAdmin
            .from('leads')
            .select('id')
            .eq('google_maps_url', lead.google_maps_url)
            .maybeSingle();
          
          if (existing) {
            console.log(`[search-leads] Skipping duplicate: "${lead.business_name}"`);
            savedCount++;
            continue;
          }
        }

        const { error: insertError } = await supabaseAdmin
          .from('leads')
          .insert(lead);

        if (insertError) {
          console.error(`[search-leads] Insert error for "${lead.business_name}":`, insertError.message);
          errors.push(`${lead.business_name}: ${insertError.message}`);
        } else {
          savedCount++;
        }
      } catch (err) {
        console.error(`[search-leads] Error saving "${lead.business_name}":`, err);
        errors.push(`${lead.business_name}: ${err.message}`);
      }
    }

    // Update campaign stats if campaign_id provided
    if (campaign_id) {
      try {
        await supabaseAdmin
          .from('campaigns')
          .update({
            total_leads: savedCount,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', campaign_id);
      } catch (err) {
        console.error('[search-leads] Error updating campaign:', err);
      }
    }

    console.log(`[search-leads] Done! Saved ${savedCount}/${leads.length} leads`);

    return new Response(
      JSON.stringify({
        success: true,
        leads_found: leads.length,
        leads_saved: savedCount,
        errors: errors.length > 0 ? errors : undefined,
        leads: leads.map(l => ({
          business_name: l.business_name,
          phone: l.phone,
          city: l.city,
          rating: l.rating,
          website_url: l.website_url,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[search-leads] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
