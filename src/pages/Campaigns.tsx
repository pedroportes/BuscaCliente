import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Play, Pause, Trash2, MapPin, Users, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCampaigns, useCampaignStats } from '@/hooks/useCampaigns';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  running: { label: 'Em execução', color: 'bg-warning/20 text-warning' },
  completed: { label: 'Concluída', color: 'bg-success/20 text-success' },
  paused: { label: 'Pausada', color: 'bg-destructive/20 text-destructive' },
};

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: campaigns, isLoading } = useCampaigns();
  const { data: stats } = useCampaignStats();

  const filteredCampaigns = (campaigns || []).filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.search_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <AppLayout title="Campanhas" subtitle="Gerencie suas campanhas de prospecção">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end">
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Campanhas</CardDescription>
              <CardTitle className="text-2xl">{stats?.total || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Em Execução</CardDescription>
              <CardTitle className="text-2xl text-warning">
                {stats?.running || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concluídas</CardDescription>
              <CardTitle className="text-2xl text-success">
                {stats?.completed || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Leads</CardDescription>
              <CardTitle className="text-2xl text-primary">
                {stats?.totalLeads || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Todas as Campanhas</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar campanhas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Nichos</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma campanha encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCampaigns.map((campaign) => {
                      const status = campaign.status || 'draft';
                      const config = statusConfig[status] || statusConfig.draft;
                      
                      return (
                        <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Link 
                              to={`/leads?campaign=${campaign.id}`}
                              className="font-medium hover:text-primary transition-colors"
                            >
                              {campaign.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {campaign.search_location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {campaign.search_niches.slice(0, 2).map((niche, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {niche}
                                </Badge>
                              ))}
                              {campaign.search_niches.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{campaign.search_niches.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{campaign.total_leads || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "font-normal",
                                config.color
                              )}
                            >
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(campaign.created_at)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/leads?campaign=${campaign.id}`}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Ver Leads
                                  </Link>
                                </DropdownMenuItem>
                                {status === 'running' ? (
                                  <DropdownMenuItem>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pausar
                                  </DropdownMenuItem>
                                ) : status === 'paused' ? (
                                  <DropdownMenuItem>
                                    <Play className="h-4 w-4 mr-2" />
                                    Retomar
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
