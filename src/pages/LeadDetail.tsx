import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Star,
  Globe,
  Phone,
  Mail,
  MessageCircle,
  Instagram,
  Facebook,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  Send,
  Plus,
  User,
  Calendar,
  Loader2,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const [whatsappMethod, setWhatsappMethod] = useState<'app' | 'api'>('app');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

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

  const handleGenerateCopy = useCallback(async () => {
    if (!lead) return;
    setIsGenerating(true);
    setGeneratedCopy('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: {
          lead: {
            business_name: lead.business_name,
            city: lead.city,
            state: lead.state,
            rating: lead.rating,
            total_reviews: lead.total_reviews,
            category: lead.category,
            website_url: lead.website_url,
            has_whatsapp: lead.has_whatsapp,
          },
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Erro ao gerar copy',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setGeneratedCopy(data?.copy || 'Não foi possível gerar a mensagem.');
    } catch (err: any) {
      console.error('Error generating copy:', err);
      toast({
        title: 'Erro ao gerar copy',
        description: err.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [lead, toast]);

  const handleSendWhatsApp = async () => {
    if (!lead?.phone || !generatedCopy) return;

    if (whatsappMethod === 'app') {
      const phone = lead.phone.replace(/\D/g, '');
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(generatedCopy)}`;
      window.open(url, '_blank');
      toast({
        title: 'WhatsApp aberto!',
        description: 'Continue o envio no aplicativo.',
      });
    } else {
      // API fallback logic
      toast({
        title: 'Envio via API',
        description: 'Funcionalidade em desenvolvimento. Use o envio pelo App por enquanto.',
        variant: 'default',
      });
      console.log('API send requested', { phone: lead.phone, message: generatedCopy });
    }
  };



  const handleEnrichLead = useCallback(async () => {
    if (!lead) return;
    setIsEnriching(true);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-lead', {
        body: { lead_id: lead.id },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Erro ao enriquecer lead',
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Lead enriquecido!',
        description: 'Dados do lead atualizados com sucesso.',
      });

      // Reload the page to see updated data
      window.location.reload();
    } catch (err: any) {
      console.error('Error enriching lead:', err);
      toast({
        title: 'Erro ao enriquecer lead',
        description: err.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsEnriching(false);
    }
  }, [lead, toast]);

  const handleOpenEmailDialog = () => {
    if (!lead?.email) {
      toast({
        title: 'Email não disponível',
        description: 'Este lead não possui email cadastrado.',
        variant: 'destructive',
      });
      return;
    }
    setEmailSubject(`FlowDrain - Proposta para ${lead.business_name}`);
    setEmailDialogOpen(true);
  };

  const handleSendEmail = useCallback(async () => {
    if (!lead?.email || !generatedCopy || !emailSubject) return;

    setIsSendingEmail(true);
    try {
      // Tentar envio via API primeiro
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: lead.email,
          subject: emailSubject,
          body: generatedCopy,
          leadId: lead.id,
          leadName: lead.business_name
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Email enviado com sucesso!',
        description: 'O email foi enviado via Resend.',
        variant: 'default',
      });
      setEmailDialogOpen(false);
    } catch (apiError: any) {
      console.error('Erro ao enviar email via API:', apiError);

      toast({
        title: 'Falha no envio automático',
        description: 'Abrindo cliente de email padrão como fallback...',
        variant: 'destructive',
      });

      // Fallback para Gmail
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(generatedCopy)}`;
      window.open(gmailUrl, '_blank');

      setEmailDialogOpen(false);
    } finally {
      setIsSendingEmail(false);
    }
  }, [lead, generatedCopy, emailSubject, toast]);

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
          <Card className="p-4 md:p-6 bg-card border-0 shadow-md">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Localização</p>
                  {lead.google_maps_url ? (
                    <a
                      href={lead.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {lead.city || '-'}, {lead.state || '-'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : lead.full_address ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.full_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {lead.city || '-'}, {lead.state || '-'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="font-medium text-card-foreground">{lead.city || '-'}, {lead.state || '-'}</p>
                  )}
                </div>
              </div>
              {lead.website_url && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <Globe className="w-5 h-5 text-success" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Website</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1 truncate">
                        Visitar site <ExternalLink className="w-3 h-3" />
                      </a>

                      {(lead.instagram_url || lead.facebook_url) && (
                        <div className="hidden sm:block h-4 w-px bg-border my-auto" />
                      )}

                      <div className="flex items-center gap-1">
                        {lead.instagram_url && (
                          <a
                            href={lead.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 p-1 rounded-md transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}

                        {lead.facebook_url && (
                          <a
                            href={lead.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-md transition-colors"
                            title="Facebook"
                          >
                            <Facebook className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs */}
          <Card className="bg-card border-0 shadow-md overflow-hidden">
            <Tabs defaultValue="engagement" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-2 md:px-4 overflow-x-auto">
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

                    {lead.instagram_url && (
                      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                        <Instagram className="w-5 h-5 text-pink-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Instagram</p>
                          <a
                            href={lead.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline truncate block text-primary"
                          >
                            Visitar perfil
                          </a>
                        </div>
                      </div>
                    )}

                    {lead.facebook_url && (
                      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                        <Facebook className="w-5 h-5 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">Facebook</p>
                          <a
                            href={lead.facebook_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline truncate block text-primary"
                          >
                            Visitar perfil
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="engagement" className="mt-0 space-y-6">
                  {/* AI Copy Generator */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Gerador de Copy com IA
                      </h3>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          onClick={handleEnrichLead}
                          disabled={isEnriching}
                          variant="outline"
                          className="gap-2 flex-1 sm:flex-none"
                        >
                          {isEnriching ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                              Enriquecendo...
                            </span>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Enriquecer
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleGenerateCopy}
                          disabled={isGenerating}
                          className="gradient-primary flex-1 sm:flex-none"
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
                    </div>

                    <Textarea
                      placeholder="Clique em 'Gerar Mensagem' para criar uma copy personalizada com IA..."
                      value={generatedCopy}
                      onChange={(e) => setGeneratedCopy(e.target.value)}
                      className="min-h-[200px]"
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex flex-1 gap-0">
                        <Select value={whatsappMethod} onValueChange={(v: 'app' | 'api') => setWhatsappMethod(v)}>
                          <SelectTrigger className="w-[100px] rounded-r-none border-r-0 focus:ring-1 focus:ring-primary focus:z-10 bg-muted/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="app">
                              <span className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" /> App
                              </span>
                            </SelectItem>
                            <SelectItem value="api">
                              <span className="flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Evol.
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          className="flex-1 gap-2 rounded-l-none"
                          disabled={!generatedCopy || isSendingWhatsApp}
                          onClick={handleSendWhatsApp}
                          variant={whatsappMethod === 'api' ? 'default' : 'outline'}
                        >
                          {isSendingWhatsApp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {whatsappMethod === 'api' ? 'Enviar' : 'Enviar'}
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        disabled={!generatedCopy}
                        onClick={handleOpenEmailDialog}
                      >
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

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Para</Label>
              <Input value={lead.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Assunto</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Assunto do email..."
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={generatedCopy}
                onChange={(e) => setGeneratedCopy(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || !emailSubject}
              className="gradient-primary gap-2"
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSendingEmail ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
