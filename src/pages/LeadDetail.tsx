import { useState, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Zap,
  Edit2,
  Check,
  X,
  Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { cn } from '@/lib/utils';
import { BulkEmailModal } from "@/components/campaigns/BulkEmailModal";

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
  const { status: evolutionStatus, sendWhatsAppMessage } = useEvolutionApi();
  const [whatsappMethod, setWhatsappMethod] = useState<'app' | 'api'>('app');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  /* New edit states */
  const [isEnriching, setIsEnriching] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<any>({});

  /* Copy Generator State */
  const [copyChannel, setCopyChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [showEmailModal, setShowEmailModal] = useState(false);



  const { data: lead, isLoading, refetch } = useQuery({
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

  // Query para notas do lead
  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['lead_notes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Query para atividades do lead (incluindo mensagens)
  const { data: activities = [] } = useQuery({
    queryKey: ['lead_activities', id],
    queryFn: async () => {
      // Buscar atividades
      const { data: actData } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });

      // Buscar mensagens
      const { data: msgData } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });

      // Combinar e formatar
      const combined: any[] = [];

      actData?.forEach(a => {
        combined.push({
          id: a.id,
          type: a.activity_type,
          date: a.created_at,
          metadata: a.metadata
        });
      });

      msgData?.forEach(m => {
        combined.push({
          id: m.id,
          type: m.channel === 'whatsapp' ? 'whatsapp_sent' : 'email_sent',
          date: m.created_at,
          status: m.status,
          body: m.body?.substring(0, 50) + (m.body?.length > 50 ? '...' : '')
        });
      });

      // Ordenar por data
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!id,
  });

  const [isSavingNote, setIsSavingNote] = useState(false);

  const handleSaveNote = async () => {
    if (!newNote.trim() || !lead?.id) return;
    setIsSavingNote(true);
    try {
      const { error } = await supabase.from('lead_notes').insert({
        lead_id: lead.id,
        content: newNote.trim(),
      });
      if (error) throw error;
      setNewNote('');
      refetchNotes();
      toast({ title: 'Nota salva!' });
    } catch (e: any) {
      toast({ title: 'Erro ao salvar nota', description: e.message, variant: 'destructive' });
    } finally {
      setIsSavingNote(false);
    }
  };
  const [stage, setStage] = useState<string>('new');

  // Sincronizar estado com dados do lead
  useEffect(() => {
    if (lead?.stage) {
      setStage(lead.stage);
    }
  }, [lead?.stage]);

  // Initialize edit state when lead data loads
  useCallback(() => {
    if (lead) {
      setEditedLead(lead);
    }
  }, [lead]);

  // Effect to update editedLead when lead changes
  if (lead && !editedLead.id) {
    setEditedLead(lead);
  }

  const handleSaveLead = async () => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          business_name: editedLead.business_name,
          phone: editedLead.phone,
          email: editedLead.email,
          website_url: editedLead.website_url,
          city: editedLead.city,
          state: editedLead.state,
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: 'Lead atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });
      setIsEditing(false);
      // Force refresh data
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const cancelEdit = () => {
    setEditedLead(lead);
    setIsEditing(false);
  };

  const handleStageChange = async (newStage: string) => {
    if (!lead) return;

    try {
      console.log('Updating stage for lead:', lead.id, 'to:', newStage);

      const { data, error } = await supabase
        .from('leads')
        .update({ stage: newStage })
        .eq('id', lead.id)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) throw error;

      setStage(newStage);
      await refetch(); // Recarrega os dados do lead

      toast({
        title: 'Estágio atualizado!',
        description: `Lead movido para ${stageConfig[newStage]?.label || newStage}`,
      });
    } catch (error: any) {
      console.error('Error updating stage:', error);
      toast({
        title: 'Erro ao atualizar estágio',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


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
          channel: copyChannel
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
  }, [lead, toast, copyChannel]);

  const handleSendWhatsApp = async () => {
    if (!lead?.phone || !generatedCopy) return;

    // Helper function to open WhatsApp Web
    const openWhatsAppWeb = () => {
      const phone = lead.phone.replace(/\D/g, '');
      const url = `https://wa.me/55${phone}?text=${encodeURIComponent(generatedCopy)}`;
      window.open(url, '_blank');
    };

    if (whatsappMethod === 'api') {
      // Try to send via Evolution API
      if (evolutionStatus.connected) {
        const success = await sendWhatsAppMessage(lead.phone, generatedCopy);

        if (success) {
          // Save message record
          supabase.from('messages').insert({
            lead_id: lead.id,
            body: generatedCopy,
            channel: 'whatsapp',
            status: 'sent',
            direction: 'outbound',
            sent_at: new Date().toISOString(),
          }).then(({ error }) => {
            if (error) console.warn('Erro ao salvar mensagem:', error);
          });
          return; // Success - message already shows toast
        } else {
          // API failed - fallback to WhatsApp Web
          openWhatsAppWeb();
          toast({
            title: 'Abrindo WhatsApp Web',
            description: 'Falha na API, abrindo WhatsApp Web',
            variant: 'default',
          });
        }
      } else {
        // Not connected - fallback
        openWhatsAppWeb();
        toast({
          title: 'WhatsApp não conectado',
          description: 'Conecte nas configurações ou use o modo App',
          variant: 'default',
        });
      }
    } else {
      // Manual app mode
      openWhatsAppWeb();
      toast({
        title: 'WhatsApp aberto!',
        description: 'Continue o envio no aplicativo.',
      });

      // Save message as pending
      supabase.from('messages').insert({
        lead_id: lead.id,
        body: generatedCopy,
        channel: 'whatsapp',
        status: 'pending',
        direction: 'outbound',
      }).then(({ error }) => {
        if (error) console.warn('Erro ao salvar mensagem:', error);
      });
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

      // Salvar registro da mensagem enviada (não-bloqueante)
      supabase.from('messages').insert({
        lead_id: lead.id,
        body: generatedCopy,
        channel: 'email',
        status: 'sent',
        direction: 'outbound',
        sent_at: new Date().toISOString(),
      }).then(({ error: insertError }) => {
        if (insertError) console.warn('Erro ao salvar mensagem:', insertError);
      });

      toast({
        title: 'Email enviado com sucesso!',
        description: 'O email foi enviado via Resend.',
        variant: 'default',
      });
      setEmailDialogOpen(false);
    } catch (apiError: any) {
      console.error('Erro ao enviar email via API:', apiError);

      // Salvar registro como pendente/manual (não-bloqueante)
      supabase.from('messages').insert({
        lead_id: lead.id,
        body: generatedCopy,
        channel: 'email',
        status: 'pending',
        direction: 'outbound',
      }).then(({ error: insertError }) => {
        if (insertError) console.warn('Erro ao salvar mensagem:', insertError);
      });

      toast({
        title: "Envio automático não realizado",
        description: "Provável limitação do plano gratuito (verifique se está enviando para seu próprio email). Abrindo cliente externo...",
        variant: "destructive",
      });

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
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl border-2 shrink-0",
                  getScoreColor(lead.lead_score || 0)
                )}>
                  {lead.lead_score || 0}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex-1 space-y-2 mb-2">
                      <Label htmlFor="business_name">Nome da Empresa</Label>
                      <Input
                        id="business_name"
                        value={editedLead.business_name || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, business_name: e.target.value })}
                        className="text-xl font-bold h-auto py-2"
                      />
                    </div>
                  ) : (
                    <h2 className="text-xl font-bold text-card-foreground truncate">{lead.business_name}</h2>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-medium">{lead.rating || '-'}</span>
                    <span className="text-muted-foreground">({lead.total_reviews || 0} avaliações)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => { setEditedLead(lead); setIsEditing(true); }} className="gap-2">
                    <Edit2 className="w-4 h-4" /> Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveLead}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <Select value={currentStage} onValueChange={handleStageChange}>
                  <SelectTrigger className="w-32 sm:w-40">
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
            </div>

            {/* Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Phone className="w-5 h-5 text-primary" />
                <div className="flex-1 w-full min-w-0">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  {isEditing ? (
                    <Input
                      value={editedLead.phone || ''}
                      onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                      className="h-8 mt-1 text-sm"
                    />
                  ) : (
                    <p className="font-medium text-card-foreground truncate">{lead.phone || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Mail className="w-5 h-5 text-accent" />
                <div className="flex-1 w-full min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  {isEditing ? (
                    <Input
                      value={editedLead.email || ''}
                      onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                      className="h-8 mt-1 text-sm"
                    />
                  ) : (
                    <p className="font-medium text-card-foreground truncate">{lead.email || '-'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <MapPin className="w-5 h-5 text-destructive" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Localização</p>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={editedLead.city || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, city: e.target.value })}
                        placeholder="Cidade"
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        value={editedLead.state || ''}
                        onChange={(e) => setEditedLead({ ...editedLead, state: e.target.value })}
                        placeholder="UF"
                        className="h-8 text-sm w-16"
                      />
                    </div>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.city || ''}, ${lead.state || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      {lead.city || '-'}, {lead.state || '-'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Globe className="w-5 h-5 text-success" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Website</p>
                  {isEditing ? (
                    <Input
                      value={editedLead.website_url || ''}
                      onChange={(e) => setEditedLead({ ...editedLead, website_url: e.target.value })}
                      className="h-8 mt-1 text-sm"
                      placeholder="https://..."
                    />
                  ) : (
                    lead.website_url ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1 truncate">
                          Visitar site <ExternalLink className="w-3 h-3" />
                        </a>

                        {(lead.instagram_url || lead.facebook_url) && (
                          <div className="hidden sm:block h-4 w-px bg-border my-auto" />
                        )}

                        <div className="flex items-center gap-1">
                          {lead.instagram_url && (
                            <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 p-1 rounded-md transition-colors">
                              <Instagram className="w-4 h-4" />
                            </a>
                          )}
                          {lead.facebook_url && (
                            <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-md transition-colors">
                              <Facebook className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )
                  )}
                </div>
              </div>
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary" />
                          Gerador de Copy com IA
                        </h3>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                        <div className="flex bg-muted p-1 rounded-lg">
                          <Button
                            variant={copyChannel === 'whatsapp' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCopyChannel('whatsapp')}
                            className="h-8 rounded-r-none"
                          >
                            WhatsApp
                          </Button>
                          <Button
                            variant={copyChannel === 'email' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCopyChannel('email')}
                            className="h-8 rounded-l-none border-l"
                          >
                            Email
                          </Button>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleEnrichLead} disabled={isEnriching} className="h-8">
                          {isEnriching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                          Enriquecer
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowEmailModal(true)}
                          className="h-8 gap-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200"
                        >
                          <Mail className="w-4 h-4" />
                          Sequência
                        </Button>

                        <Button onClick={handleGenerateCopy} disabled={isGenerating} size="sm" className="h-8">
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando...
                            </>
                          ) : (
                            `Gerar ${copyChannel === 'whatsapp' ? 'WhatsApp' : 'Email'}`
                          )}
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={generatedCopy}
                      onChange={(e) => setGeneratedCopy(e.target.value)}
                      placeholder="Clique em 'Gerar Mensagem' para criar uma copy personalizada com IA..."
                      className="min-h-[150px] p-4 text-base"
                    />

                    <div className="flex flex-col sm:flex-row justify-between items-center bg-muted/50 p-2 rounded-lg gap-2">
                      <Select value={whatsappMethod} onValueChange={(v: 'app' | 'api') => setWhatsappMethod(v)}>
                        <SelectTrigger className="w-40 h-8 border-0 bg-transparent focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="app">App (Manual)</SelectItem>
                          <SelectItem value="api">API (Automático)</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCopy);
                            toast({ title: 'Copiado!' });
                          }}
                          disabled={!generatedCopy}
                        >
                          <span className="sr-only">Copiar</span>
                          📋
                        </Button>

                        <Button variant="ghost" onClick={handleSendWhatsApp} className="gap-2" disabled={!generatedCopy}>
                          <Send className="w-4 h-4" />
                          Enviar WhatsApp
                        </Button>

                        <Button
                          variant="ghost"
                          className="gap-2 text-muted-foreground hover:text-foreground"
                          onClick={handleOpenEmailDialog}
                          disabled={!lead.email}
                        >
                          <Mail className="w-4 h-4" />
                          Enviar Email
                        </Button>
                      </div>
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
                    <Button
                      className="gradient-primary self-end"
                      onClick={handleSaveNote}
                      disabled={isSavingNote || !newNote.trim()}
                    >
                      {isSavingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma nota ainda. Adicione a primeira!
                      </div>
                    ) : (
                      notes.map((note: any) => (
                        <Card key={note.id} className="p-3 bg-muted/20">
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(note.created_at).toLocaleString('pt-BR')}
                          </p>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <div className="space-y-4">
                    {activities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 border-l-2 border-primary/30 bg-muted/10 rounded-r-md">
                        <div className="mt-1">
                          {activity.type === 'created' && <Plus className="w-4 h-4 text-primary" />}
                          {activity.type === 'whatsapp_sent' && <MessageCircle className="w-4 h-4 text-green-500" />}
                          {activity.type === 'email_sent' && <Mail className="w-4 h-4 text-blue-500" />}
                          {activity.type === 'stage_changed' && <Zap className="w-4 h-4 text-yellow-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium">
                              {activity.type === 'created' && 'Lead criado'}
                              {activity.type === 'whatsapp_sent' && 'WhatsApp enviado'}
                              {activity.type === 'email_sent' && 'Email enviado'}
                              {activity.type === 'stage_changed' && 'Estágio alterado'}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.date).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          {activity.body && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              "{activity.body}"
                            </p>
                          )}
                          {activity.metadata && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {JSON.stringify(activity.metadata)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {activities.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Nenhuma atividade registrada.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div >

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
                placeholder="A mensagem gerada aparecerá aqui..."
                className="min-h-[100px] text-base resize-none"
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
      <BulkEmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        selectedLeads={lead ? [lead.id] : []}
        onSuccess={() => toast({ title: "Sequência agendada com sucesso!" })}
      />
    </AppLayout>
  );
}
