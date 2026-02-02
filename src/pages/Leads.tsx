import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
  Instagram
} from 'lucide-react';
import { mockLeads, mockCampaigns, mockTags } from '@/data/mockData';

import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { LeadTemperatureBadge } from '@/components/leads/LeadTemperatureBadge';
import { DataSourceBadge } from '@/components/leads/DataSourceBadge';

const stageConfig = {
  new: { label: 'Novo', className: 'bg-muted text-muted-foreground' },
  contacted: { label: 'Contactado', className: 'bg-primary/10 text-primary' },
  qualified: { label: 'Qualificado', className: 'bg-success/10 text-success' },
  proposal: { label: 'Proposta', className: 'bg-warning/10 text-warning' },
  won: { label: 'Ganho', className: 'bg-success/20 text-success' },
  lost: { label: 'Perdido', className: 'bg-destructive/10 text-destructive' },
};

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;

  const filteredLeads = useMemo(() => {
    return mockLeads.filter(lead => {
      const matchesSearch = lead.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCampaign = selectedCampaign === 'all' || lead.campaign_id === selectedCampaign;
      const matchesStage = selectedStage === 'all' || lead.stage === selectedStage;
      const matchesScore = lead.lead_score >= scoreRange[0] && lead.lead_score <= scoreRange[1];
      
      return matchesSearch && matchesCampaign && matchesStage && matchesScore;
    });
  }, [searchQuery, selectedCampaign, selectedStage, scoreRange]);

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

  return (
    <AppLayout 
      title="Leads" 
      subtitle={`${filteredLeads.length} leads encontrados`}
    >
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <Card className="w-72 p-5 bg-card border-0 shadow-md h-fit sticky top-24 flex-shrink-0">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-card-foreground">Filtros</h3>
          </div>

          <div className="space-y-6">
            {/* Campaign Filter */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Campanha</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as campanhas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as campanhas</SelectItem>
                  {mockCampaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stage Filter */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-2 block">Estágio</label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estágios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estágios</SelectItem>
                  {Object.entries(stageConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lead Score Range */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-3 block">
                Lead Score: {scoreRange[0]} - {scoreRange[1]}
              </label>
              <Slider
                value={scoreRange}
                onValueChange={setScoreRange}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-primary"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-3 block">Tags</label>
              <div className="space-y-2">
                {mockTags.map(tag => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox id={tag.id} />
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm text-card-foreground">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setSelectedCampaign('all');
                setSelectedStage('all');
                setScoreRange([0, 100]);
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nome ou cidade..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedLeads.length > 0 && (
                <Badge variant="secondary" className="px-3 py-1">
                  {selectedLeads.length} selecionados
                </Badge>
              )}
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
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
                  {paginatedLeads.map((lead, index) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-muted/30 transition-colors animate-fade-in cursor-pointer"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-4 py-3">
                        <Checkbox 
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleLeadSelection(lead.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm",
                          getScoreColor(lead.lead_score)
                        )}>
                          {lead.lead_score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/leads/${lead.id}`} className="hover:text-primary transition-colors">
                          <p className="font-medium text-card-foreground">{lead.business_name}</p>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {lead.tags?.slice(0, 2).map(tag => (
                              <span 
                                key={tag.id}
                                className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                            {lead.email_source && (
                              <DataSourceBadge source={lead.email_source} />
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <LeadTemperatureBadge temperature={lead.lead_temperature} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div>
                          <p>{lead.city}/{lead.state}</p>
                          {lead.neighborhood && (
                            <p className="text-xs text-muted-foreground">{lead.neighborhood}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          <span className="text-sm font-medium">{lead.rating}</span>
                          <span className="text-xs text-muted-foreground">({lead.total_reviews})</span>
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
                        <Badge className={cn("rounded-full", stageConfig[lead.stage].className)}>
                          {stageConfig[lead.stage].label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * leadsPerPage) + 1} a {Math.min(currentPage * leadsPerPage, filteredLeads.length)} de {filteredLeads.length}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
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
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
