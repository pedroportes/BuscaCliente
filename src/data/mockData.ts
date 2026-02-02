import { Lead, Campaign, DashboardMetrics, LeadTag } from '@/types';

export const mockTags: LeadTag[] = [
  { id: '1', company_id: '1', name: 'Quente', color: '#EF4444' },
  { id: '2', company_id: '1', name: 'Website OK', color: '#10B981' },
  { id: '3', company_id: '1', name: 'WhatsApp', color: '#22C55E' },
  { id: '4', company_id: '1', name: 'Retornar', color: '#F59E0B' },
  { id: '5', company_id: '1', name: 'Sem resposta', color: '#6B7280' },
  { id: '6', company_id: '1', name: 'Instagram', color: '#E1306C' },
  { id: '7', company_id: '1', name: 'Email extraído', color: '#3B82F6' },
];

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    company_id: '1',
    name: 'Desentupidoras São Paulo',
    status: 'completed',
    search_location: 'São Paulo, SP',
    search_niches: ['Desentupidora', 'Hidrojateamento'],
    total_leads: 47,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    company_id: '1',
    name: 'Caça Vazamentos RJ',
    status: 'running',
    search_location: 'Rio de Janeiro, RJ',
    search_niches: ['Caça Vazamentos', 'Limpeza de Caixa D\'água'],
    total_leads: 23,
    created_at: '2024-01-20T14:30:00Z',
  },
  {
    id: '3',
    company_id: '1',
    name: 'Grande BH',
    status: 'draft',
    search_location: 'Belo Horizonte, MG',
    search_niches: ['Desentupidora'],
    total_leads: 0,
    created_at: '2024-01-25T09:00:00Z',
  },
];

const cities = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Rio de Janeiro', state: 'RJ' },
  { city: 'Belo Horizonte', state: 'MG' },
  { city: 'Curitiba', state: 'PR' },
  { city: 'Porto Alegre', state: 'RS' },
  { city: 'Campinas', state: 'SP' },
  { city: 'Guarulhos', state: 'SP' },
  { city: 'Salvador', state: 'BA' },
];

const neighborhoods = [
  'Centro', 'Jardins', 'Vila Nova', 'Bela Vista', 'Consolação',
  'Moema', 'Pinheiros', 'Ipanema', 'Copacabana', 'Savassi',
  'Funcionários', 'Batel', 'Água Verde', 'Moinhos de Vento',
];

const businessNames = [
  'Desentupidora Rápida',
  'Hidro Clean Services',
  'Desentope Já',
  'Caça Vazamentos Express',
  'Desentupidora 24h',
  'Limpa Fácil',
  'Desentupidora Premium',
  'Hidrojato Master',
  'Serviços Hidráulicos Pro',
  'Desentupidora Central',
  'AquaFlow Desentupimentos',
  'Desentupidora União',
  'Fast Clean Desentupidora',
  'Desentupidora Técnica',
  'Super Desentupidora',
];

function generateMockLeads(): Lead[] {
  const leads: Lead[] = [];
  const stages: Lead['stage'][] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
  const emailSources: Lead['email_source'][] = ['website', 'google', 'instagram', 'manual'];
  
  for (let i = 0; i < 50; i++) {
    const cityData = cities[Math.floor(Math.random() * cities.length)];
    const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
    const hasWebsite = Math.random() > 0.4;
    const hasWhatsapp = Math.random() > 0.3;
    const hasEmail = Math.random() > 0.3;
    const hasInstagram = Math.random() > 0.5;
    const rating = Math.round((3 + Math.random() * 2) * 10) / 10;
    const reviews = Math.floor(Math.random() * 200);
    
    // Calculate lead score
    let score = 0;
    if (hasWebsite) score += 20;
    if (hasWhatsapp) score += 15;
    if (hasInstagram) score += 10;
    if (rating >= 4.5) score += 25;
    else if (rating >= 4.0) score += 15;
    if (reviews >= 50) score += 15;
    else if (reviews >= 20) score += 8;
    if (hasEmail) score += 15;
    
    // Determine temperature based on score
    let temperature: Lead['lead_temperature'] = 'cold';
    if (score >= 75) temperature = 'hot';
    else if (score >= 50) temperature = 'warm';
    else if (score >= 25) temperature = 'cold';
    
    // If stage is 'won', mark as converted
    const stage = stages[Math.floor(Math.random() * stages.length)];
    if (stage === 'won') temperature = 'converted';
    
    const businessSlug = businessNames[i % businessNames.length].toLowerCase().replace(/\s/g, '');
    
    const randomTags = mockTags
      .filter(() => Math.random() > 0.75)
      .slice(0, 3);

    leads.push({
      id: `lead-${i + 1}`,
      company_id: '1',
      campaign_id: i < 25 ? '1' : '2',
      business_name: `${businessNames[i % businessNames.length]} ${cityData.city}`,
      phone: Math.random() > 0.1 ? `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}` : null,
      email: hasEmail ? `contato@${businessSlug}.com.br` : null,
      email_source: hasEmail ? emailSources[Math.floor(Math.random() * emailSources.length)] : null,
      city: cityData.city,
      state: cityData.state,
      address: `Rua ${neighborhood}, ${Math.floor(Math.random() * 2000) + 1}`,
      neighborhood: neighborhood,
      postal_code: `${Math.floor(Math.random() * 90000) + 10000}-${Math.floor(Math.random() * 900) + 100}`,
      rating,
      total_reviews: reviews,
      website_url: hasWebsite ? `https://${businessSlug}.com.br` : null,
      instagram_url: hasInstagram ? `https://instagram.com/${businessSlug}` : null,
      instagram_followers: hasInstagram ? Math.floor(Math.random() * 10000) + 100 : null,
      google_maps_url: `https://maps.google.com/?cid=${Math.floor(Math.random() * 10000000000)}`,
      has_whatsapp: hasWhatsapp,
      lead_score: Math.min(score, 100),
      lead_temperature: temperature,
      stage,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      scraped_at: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
      tags: randomTags,
    });
  }
  
  return leads.sort((a, b) => b.lead_score - a.lead_score);
}

export const mockLeads = generateMockLeads();

export const mockMetrics: DashboardMetrics = {
  totalLeads: mockLeads.length,
  qualifiedLeads: mockLeads.filter(l => l.stage === 'qualified' || l.stage === 'proposal' || l.stage === 'won').length,
  conversionRate: 12.5,
  creditsRemaining: 347,
};

export const mockChartData = [
  { date: '01/01', leads: 4 },
  { date: '05/01', leads: 7 },
  { date: '10/01', leads: 12 },
  { date: '15/01', leads: 8 },
  { date: '20/01', leads: 15 },
  { date: '25/01', leads: 22 },
  { date: '30/01', leads: 18 },
];

export const recentActivities = [
  { id: '1', type: 'lead_added', message: 'Novo lead: Desentupidora Rápida SP', time: '2 min atrás' },
  { id: '2', type: 'campaign_completed', message: 'Campanha "SP Centro" finalizada', time: '1 hora atrás' },
  { id: '3', type: 'email_sent', message: 'Email enviado para Hidro Clean', time: '3 horas atrás' },
  { id: '4', type: 'lead_qualified', message: 'Lead qualificado: Caça Vazamentos RJ', time: '5 horas atrás' },
  { id: '5', type: 'note_added', message: 'Nota adicionada em Limpa Fácil', time: 'Ontem' },
];
