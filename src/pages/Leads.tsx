import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Download,
  Filter,
  Star,
  Globe,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ArrowUpDown,
  Instagram,
  Loader2,
  ExternalLink,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { LeadTemperatureBadge } from '@/components/leads/LeadTemperatureBadge';
import { DataSourceBadge } from '@/components/leads/DataSourceBadge';
import { useLeads } from '@/hooks/useLeads';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useTags } from '@/hooks/useTags';
import { toast } from '@/components/ui/use-toast';

import { LeadFilters, LeadFiltersState } from '@/components/leads/LeadFilters';
import { BulkActions } from '@/components/leads/BulkActions';

export const stageConfig: Record<string, { label: string; className: string }> = {
  new: { label: 'Novo', className: 'bg-muted text-muted-foreground' },
  contacted: { label: 'Contactado', className: 'bg-primary/10 text-primary' },
  qualified: { label: 'Qualificado', className: 'bg-success/10 text-success' },
  proposal: { label: 'Proposta', className: 'bg-warning/10 text-warning' },
  won: { label: 'Ganho', className: 'bg-success/20 text-success' },
  lost: { label: 'Perdido', className: 'bg-destructive/10 text-destructive' },
};

export default function Leads() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const campaignIdFromUrl = searchParams.get('campaign');

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<LeadFiltersState>({
    campaign: campaignIdFromUrl || 'all',
    stage: 'all',
    scoreRange: [0, 100],
    hasWhatsapp: 'all',
    hasEmail: 'all',
    minRating: 0,
    state: 'all'
  });

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;

  const { data: leads, isLoading } = useLeads(filters.campaign);
  const { data: campaigns } = useCampaigns();
  const { data: tags } = useTags();

  const filteredLeads = useMemo(() => {
    return (leads || []).filter(lead => {
      const matchesSearch = lead.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.city || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = filters.stage === 'all' || lead.stage === filters.stage;
      const matchesScore = (lead.lead_score || 0) >= filters.scoreRange[0] && (lead.lead_score || 0) <= filters.scoreRange[1];
      const matchesWhatsapp = filters.hasWhatsapp === 'all' || lead.has_whatsapp === filters.hasWhatsapp;
      const matchesEmail = filters.hasEmail === 'all' || (filters.hasEmail ? !!lead.email : !lead.email);
      const matchesRating = !filters.minRating || (lead.rating || 0) >= filters.minRating;
      const matchesState = filters.state === 'all' || lead.state === filters.state;

      return matchesSearch && matchesStage && matchesScore && matchesWhatsapp && matchesEmail && matchesRating && matchesState;
    });
  }, [leads, searchQuery, filters]);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * leadsPerPage;
    return filteredLeads.slice(start, start + leadsPerPage);
  }, [filteredLeads, currentPage]);

  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedLeads.length === paginatedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(paginatedLeads.map(l => l.id));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success bg-success/10';
    if (score >= 40) return 'text-warning bg-warning/10';
    return 'text-muted-foreground bg-muted';
  };

  const getTemperature = (score: number | null, stage: string | null): 'cold' | 'warm' | 'hot' | 'converted' => {
    if (stage === 'won') return 'converted';
    const s = score || 0;
    if (s >= 75) return 'hot';
    if (s >= 50) return 'warm';
    return 'cold';
  };

  const handleExportAll = () => {
    try {
      if (filteredLeads.length === 0) {
        toast({ title: "Nenhum lead para exportar", variant: "destructive" });
        return;
      }

      const tableContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
            </head>
            <body>
                <table>
                    <thead>
                        <tr>
                            <th>Business Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Website</th>
                            <th>Instagram</th>
                            <th>Stage</th>
                            <th>Lead Score</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Rating</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredLeads.map(lead => `
                            <tr>
                                <td>${lead.business_name || ''}</td>
                                <td>${lead.phone || ''}</td>
                                <td>${lead.email || ''}</td>
                                <td>${lead.website_url || ''}</td>
                                <td>${lead.instagram_url || ''}</td>
                                <td>${stageConfig[lead.stage || 'new']?.label || lead.stage}</td>
                                <td>${lead.lead_score || 0}</td>
                                <td>${lead.city || ''}</td>
                                <td>${lead.state || ''}</td>
                                <td>${lead.rating || ''}</td>
                                <td>${new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

      const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_all_${new Date().toISOString().slice(0, 10)}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Exportação XLS concluída", description: `${filteredLeads.length} leads exportados.` });
    } catch (e: any) {
      toast({ title: "Erro na exportação", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout
      title="Leads"
      subtitle={`${filteredLeads.length} leads encontrados`}
    >
      {/* Filters and Main Content */}
      <div className="flex flex-col gap-4">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 w-full sm:flex-1">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <LeadFilters
              filters={filters}
              setFilters={setFilters}
              totalResults={filteredLeads.length}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedLeads.length > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {selectedLeads.length} selecionados
              </Badge>
            )}
            <Button variant="outline" className="gap-2" size="sm" onClick={handleExportAll}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar ({filteredLeads.length})</span>
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="bg-card border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <Checkbox
                      checked={selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0}
                      onCheckedChange={toggleAllSelection}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
                      Score <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Empresa</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Temperatura</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cidade/UF</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Canais</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Estágio</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-12 rounded-full" /></td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-4 py-3"><div className="flex gap-1"><Skeleton className="h-4 w-4" /><Skeleton className="h-4 w-4" /></div></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-6 w-6" /></td>
                    </tr>
                  ))
                ) : paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-0">
                      <EmptyState
                        icon={Users}
                        title="Nenhum lead encontrado"
                        description={searchQuery || filters.campaign !== 'all' || filters.stage !== 'all'
                          ? "Tente ajustar seus filtros de busca"
                          : "Comece uma campanha para buscar seus primeiros leads no Google Maps"}
                        actionLabel={!(searchQuery || filters.campaign !== 'all' || filters.stage !== 'all') ? "Nova Campanha" : undefined}
                        actionHref={!(searchQuery || filters.campaign !== 'all' || filters.stage !== 'all') ? "/campaigns/new" : undefined}
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead, index) => {
                    const stage = lead.stage || 'new';
                    const stageInfo = stageConfig[stage] || stageConfig.new;

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-muted/30 transition-colors animate-fade-in cursor-pointer"
                        style={{ animationDelay: `${index * 30}ms` }}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={() => toggleLeadSelection(lead.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm",
                            getScoreColor(lead.lead_score || 0)
                          )}>
                            {lead.lead_score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-card-foreground hover:text-primary transition-colors">{lead.business_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <LeadTemperatureBadge temperature={getTemperature(lead.lead_score, lead.stage)} />
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          <div>
                            {lead.google_maps_url ? (
                              <a
                                href={lead.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                {lead.city || '-'}/{lead.state || '-'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <p>{lead.city || '-'}/{lead.state || '-'}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-warning text-warning" />
                            <span className="text-sm font-medium">{lead.rating || '-'}</span>
                            <span className="text-xs text-muted-foreground">({lead.total_reviews || 0})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {lead.website_url && (
                              <Globe className="w-4 h-4 text-success" />
                            )}
                            {lead.phone && (
                              <Phone className="w-4 h-4 text-primary" />
                            )}
                            {lead.email && (
                              <Mail className="w-4 h-4 text-accent" />
                            )}
                            {lead.has_whatsapp && (
                              <MessageCircle className="w-4 h-4 text-success" />
                            )}
                            {lead.instagram_url && (
                              <Instagram className="w-4 h-4 text-pink-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("rounded-full", stageInfo.className)}>
                            {stageInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border gap-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredLeads.length > 0 ? ((currentPage - 1) * leadsPerPage) + 1 : 0} a {Math.min(currentPage * leadsPerPage, filteredLeads.length)} de {filteredLeads.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(currentPage === page && "gradient-primary")}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
      <BulkActions
        selectedLeads={selectedLeads}
        onClearSelection={() => setSelectedLeads([])}
      />
    </AppLayout>
  );
}
