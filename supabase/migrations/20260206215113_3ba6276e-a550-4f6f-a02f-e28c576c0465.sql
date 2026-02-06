-- First remove all duplicate google_maps_url keeping only the newest
DELETE FROM leads a USING leads b
WHERE a.id < b.id 
AND a.google_maps_url IS NOT NULL 
AND a.google_maps_url = b.google_maps_url;

-- Delete all existing leads (test/fictional data)
DELETE FROM leads;

-- Now create unique index
CREATE UNIQUE INDEX leads_google_maps_url_unique ON public.leads (google_maps_url) WHERE google_maps_url IS NOT NULL;