import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Star, 
  Globe, 
  Phone, 
  Mail, 
  MessageCircle,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  Send,
  Plus,
  User,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const stageConfig: Record<string, { label: string; className: string }> = {
  new: { label: 'Novo', className: 'bg-muted text-muted-foreground' },
  contacted: { label: 'Contactado', className: 'bg-primary/10 text-primary' },
  qualified: { label: 'Qualificado', className: 'bg-success/10 text-success' },
  proposal: { label: 'Proposta', className: 'bg-warning/10 text-warning' },
  won: { label: 'Ganho', className: 'bg-success/20 text-success' },
  lost: { label: 'Perdido', className: 'bg-destructive/10 text-destructive' },
};

export default function LeadDetail() {
  const { id } = useParams();
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newNote, setNewNote] = useState('');

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [stage, setStage] = useState<string>(lead?.stage || 'new');

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success bg-success/10 border-success/20';
    if (score >= 40) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-muted-foreground bg-muted border-border';
  };

  const handleGenerateCopy = () => {
    if (!lead) return;
    setIsGenerating(true);
    // Mock AI generation - TODO: Conectar com Google Gemini via Edge Function
    setTimeout(() => {
      setGeneratedCopy(`Olá! Somos a GestãoFlow, uma solução completa para gestão de empresas.

Notamos que a ${lead.business_name} tem excelente reputação em ${lead.city || 'sua região'}, com ${lead.total_reviews || 0} avaliações positivas! 

Queremos ajudar vocês a crescer ainda mais com:
✅ Agendamento automatizado
✅ Controle financeiro
✅ CRM para clientes

Que tal uma demonstração gratuita de 15 minutos?`);
      setIsGenerating(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <AppLayout title="Carregando..." subtitle="">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!lead) {
    return (
      <AppLayout title="Lead não encontrado" subtitle="">
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Este lead não foi encontrado.</p>
          <Link to="/leads">
            <Button>Voltar para Leads</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const currentStage = stage || lead.stage || 'new';
  const stageInfo = stageConfig[currentStage] || stageConfig.new;

  return (
    <AppLayout 
      title={lead.business_name} 
      subtitle={`${lead.city || ''}, ${lead.state || ''}`}
    >
      {/* Back Button */}
      <Link to="/leads" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card className="p-6 bg-card border-0 shadow-md">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl border-2",
                  getScoreColor(lead.lead_score || 0)
                )}>
                  {lead.lead_score || 0}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">{lead.business_name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-medium">{lead.rating || '-'}</span>
                    <span className="text-muted-foreground">({lead.total_reviews || 0} avaliações)</span>
                  </div>
                </div>
              </div>

              <Select value={currentStage} onValueChange={setStage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(stageConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className={cn("px-2 py-0.5 rounded", config.className)}>
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              {lead.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium text-card-foreground">{lead.phone}</p>
                  </div>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Mail className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-card-foreground truncate">{lead.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <MapPin className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Localização</p>
                  <p className="font-medium text-card-foreground">{lead.city || '-'}, {lead.state || '-'}</p>
                </div>
              </div>
              {lead.website_url && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Globe className="w-5 h-5 text-success" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Website</p>
                    <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1 truncate">
                      Visitar site <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs */}
          <Card className="bg-card border-0 shadow-md overflow-hidden">
            <Tabs defaultValue="engagement" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-4">
                <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger value="engagement" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Engajamento
                </TabsTrigger>
                <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Notas
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Atividades
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="overview" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Horário de Funcionamento</p>
                        <p className="font-medium">Não disponível</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                      <MessageCircle className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <p className="font-medium">{lead.has_whatsapp ? 'Disponível' : 'Não disponível'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="engagement" className="mt-0 space-y-6">
                  {/* AI Copy Generator */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Gerador de Copy com IA
                      </h3>
                      <Button 
                        onClick={handleGenerateCopy}
                        disabled={isGenerating}
                        className="gradient-primary"
                      >
                        {isGenerating ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Gerando...
                          </span>
                        ) : (
                          'Gerar Mensagem'
                        )}
                      </Button>
                    </div>
                    
                    <Textarea 
                      placeholder="Clique em 'Gerar Mensagem' para criar uma copy personalizada com IA..."
                      value={generatedCopy}
                      onChange={(e) => setGeneratedCopy(e.target.value)}
                      className="min-h-[200px]"
                    />

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2" disabled={!generatedCopy}>
                        <MessageCircle className="w-4 h-4" />
                        Enviar WhatsApp
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2" disabled={!generatedCopy}>
                        <Mail className="w-4 h-4" />
                        Enviar Email
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-0 space-y-4">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Adicionar uma nota..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button className="gradient-primary self-end">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma nota ainda. Adicione a primeira!
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 border-l-2 border-primary/30">
                      <Plus className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Lead criado</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6 bg-card border-0 shadow-md">
            <h3 className="font-semibold mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Mail className="w-4 h-4" />
                Enviar Email
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <MessageCircle className="w-4 h-4" />
                Enviar WhatsApp
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Phone className="w-4 h-4" />
                Ligar
              </Button>
            </div>
          </Card>

          {/* Score Breakdown */}
          <Card className="p-6 bg-card border-0 shadow-md">
            <h3 className="font-semibold mb-4">Breakdown do Score</h3>
            <div className="space-y-3">
              {[
                { label: 'Website', points: lead.website_url ? 25 : 0, max: 25 },
                { label: 'WhatsApp', points: lead.has_whatsapp ? 15 : 0, max: 15 },
                { label: 'Rating', points: (lead.rating || 0) >= 4.5 ? 30 : (lead.rating || 0) >= 4 ? 20 : 10, max: 30 },
                { label: 'Avaliações', points: (lead.total_reviews || 0) >= 50 ? 20 : (lead.total_reviews || 0) >= 20 ? 10 : 0, max: 20 },
                { label: 'Email', points: lead.email ? 10 : 0, max: 10 },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className={cn(
                    "text-sm font-medium",
                    item.points === item.max ? "text-success" : "text-muted-foreground"
                  )}>
                    +{item.points}/{item.max}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Important Dates */}
          <Card className="p-6 bg-card border-0 shadow-md">
            <h3 className="font-semibold mb-4">Datas Importantes</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="text-sm font-medium">
                    {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
