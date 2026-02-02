export interface Company {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  credits_remaining: number;
  created_at: string;
}

export interface Profile {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Campaign {
  id: string;
  company_id: string;
  name: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  search_location: string;
  search_niches: string[];
  total_leads: number;
  created_at: string;
}

export interface Lead {
  id: string;
  company_id: string;
  campaign_id: string;
  business_name: string;
  phone: string | null;
  email: string | null;
  email_source?: 'website' | 'google' | 'instagram' | 'manual' | null;
  city: string;
  state: string;
  address?: string | null;
  neighborhood?: string | null;
  postal_code?: string | null;
  rating: number;
  total_reviews: number;
  website_url: string | null;
  instagram_url?: string | null;
  instagram_followers?: number | null;
  google_maps_url?: string | null;
  has_whatsapp: boolean;
  lead_score: number;
  lead_temperature: 'cold' | 'warm' | 'hot' | 'converted';
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  created_at: string;
  scraped_at?: string | null;
  tags?: LeadTag[];
}

export interface LeadTag {
  id: string;
  company_id: string;
  name: string;
  color: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  lead?: Lead;
  channel: 'email' | 'whatsapp' | 'instagram' | 'facebook';
  subject: string | null;
  body: string;
  status: 'pending' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'read';
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  error_message?: string | null;
}

export interface EngagementMetrics {
  totalSent: number;
  delivered: number;
  pending: number;
  failed: number;
  readRate: number;
  responseRate: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'instagram' | 'facebook';
  subject: string | null;
  body: string;
  variables: string[];
  category: 'prospecting' | 'follow_up' | 'promotion' | 'social' | 'reactivation' | 'post_demo';
  created_at: string;
}

export interface DashboardMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  creditsRemaining: number;
}
