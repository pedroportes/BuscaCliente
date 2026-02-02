import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Mail, 
  Instagram, 
  Facebook,
  Sparkles,
  Send,
  Clock,
  Calendar,
  Wifi,
  WifiOff,
  Settings2
} from 'lucide-react';
import { mockLeads } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { TemplateSelector } from './TemplateSelector';
import { MessageTemplate } from '@/types';
import { useNavigate } from 'react-router-dom';

interface MessageComposerProps {
  selectedLeadId?: string;
  onMessageSent?: () => void;
}

export function MessageComposer({ selectedLeadId, onMessageSent }: MessageComposerProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { status: evolutionStatus, isConfigured: isEvolutionConfigured, sendWhatsAppMessage } = useEvolutionApi();
  
  const [activeChannel, setActiveChannel] = useState<string>('whatsapp');
  const [leadId, setLeadId] = useState(selectedLeadId || '');
  const [message, setMessage] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const selectedLead = mockLeads.find(l => l.id === leadId);

  // Replace template variables with lead data
  const applyTemplateVariables = (text: string) => {
    if (!selectedLead) return text;
    
    return text
      .replace(/\{business_name\}/g, selectedLead.business_name)
      .replace(/\{city\}/g, selectedLead.city)
      .replace(/\{state\}/g, selectedLead.state)
      .replace(/\{rating\}/g, String(selectedLead.rating))
      .replace(/\{total_reviews\}/g, String(selectedLead.total_reviews));
  };

  const handleSelectTemplate = (template: MessageTemplate) => {
    const processedBody = applyTemplateVariables(template.body);
    setMessage(processedBody);
    
    if (template.subject) {
      setEmailSubject(applyTemplateVariables(template.subject));
    }
    
    // Switch to the template's channel if different
    if (template.channel !== activeChannel) {
      setActiveChannel(template.channel);
    }
    
    toast({ 
      title: 'Template aplicado!',
      description: selectedLead 
        ? 'Variáveis substituídas com dados do lead' 
        : 'Selecione um lead para substituir as variáveis',
    });
  };

  const handleGenerateAI = () => {
    if (!selectedLead) {
      toast({ title: 'Selecione um lead primeiro', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const templates = {
        whatsapp: `Olá! Somos a GestãoFlow 👋\n\nNotamos que a ${selectedLead.business_name} tem excelentes avaliações (${selectedLead.rating}⭐)!\n\nTemos uma solução completa para gestão de empresas como a sua:\n✅ Agendamento automatizado\n✅ Controle financeiro\n✅ CRM para clientes\n\nPodemos conversar? 😊`,
        email: `Olá,\n\nNotamos que a ${selectedLead.business_name} é referência em ${selectedLead.city}, com ${selectedLead.total_reviews} avaliações positivas!\n\nGostaríamos de apresentar nossa plataforma de gestão, desenvolvida especialmente para empresas do seu segmento.\n\nPodemos agendar uma demonstração gratuita de 15 minutos?\n\nAtenciosamente,\nEquipe GestãoFlow`,
        instagram: `Parabéns pelo excelente trabalho! 👏🔧\n\nVocês utilizam algum sistema de gestão para organizar os atendimentos? Temos uma solução que pode ajudar muito! 💪`,
        facebook: `Olá! Parabéns pela página! 🌟\n\nNotamos o ótimo trabalho da ${selectedLead.business_name}. Gostaríamos de apresentar nossa plataforma de gestão. Podemos conversar?`,
      };
      setMessage(templates[activeChannel as keyof typeof templates]);
      if (activeChannel === 'email') {
        setEmailSubject(`${selectedLead.business_name} - Proposta de Parceria GestãoFlow`);
      }
      setIsGenerating(false);
    }, 1500);
  };

  const handleSend = async () => {
    if (!selectedLead || !message) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setIsSending(true);

    try {
      // For WhatsApp, use Evolution API if configured
      if (activeChannel === 'whatsapp' && isEvolutionConfigured && evolutionStatus.connected) {
        const success = await sendWhatsAppMessage(selectedLead.phone || '', message);
        if (success) {
          toast({ 
            title: 'Mensagem enviada via WhatsApp!',
            description: `Enviado para ${selectedLead.business_name}`,
          });
          setMessage('');
          setEmailSubject('');
          onMessageSent?.();
        }
      } else {
        // Simulate sending for other channels or when Evolution is not configured
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ 
          title: isScheduled ? 'Mensagem agendada!' : 'Mensagem enviada!',
          description: `${activeChannel.charAt(0).toUpperCase() + activeChannel.slice(1)} para ${selectedLead.business_name}`,
        });
        setMessage('');
        setEmailSubject('');
        onMessageSent?.();
      }
    } catch (error) {
      toast({ 
        title: 'Erro ao enviar mensagem',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const canSend = {
    whatsapp: selectedLead?.has_whatsapp && selectedLead?.phone,
    email: selectedLead?.email,
    instagram: selectedLead?.instagram_url,
    facebook: true, // Assume all leads can be reached via Facebook
  };

  // WhatsApp connection status indicator
  const whatsappStatus = isEvolutionConfigured 
    ? evolutionStatus.connected 
      ? 'connected' 
      : 'disconnected'
    : 'not_configured';

  return (
    <Card className="p-6 bg-card border-0 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Enviar Mensagem</h3>
        <p className="text-xs text-muted-foreground">Selecione o lead e o canal</p>
      </div>

      {/* WhatsApp Status Alert */}
      {activeChannel === 'whatsapp' && (
        <div className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
          whatsappStatus === 'connected' 
            ? 'bg-success/10 border border-success/20' 
            : 'bg-warning/10 border border-warning/20'
        }`}>
          <div className="flex items-center gap-2">
            {whatsappStatus === 'connected' ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-warning" />
            )}
            <span className="text-sm">
              {whatsappStatus === 'connected' && 'WhatsApp conectado - Envio real ativo'}
              {whatsappStatus === 'disconnected' && 'WhatsApp desconectado - Configure nas Configurações'}
              {whatsappStatus === 'not_configured' && 'Evolution API não configurada'}
            </span>
          </div>
          {whatsappStatus !== 'connected' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 h-7"
              onClick={() => navigate('/settings')}
            >
              <Settings2 className="w-3 h-3" />
              Configurar
            </Button>
          )}
        </div>
      )}

      {/* Lead Selection */}
      <div className="mb-4">
        <Label className="text-sm text-muted-foreground mb-2 block">Selecionar Lead</Label>
        <Select value={leadId} onValueChange={setLeadId}>
          <SelectTrigger>
            <SelectValue placeholder="Escolha um lead..." />
          </SelectTrigger>
          <SelectContent>
            {mockLeads.slice(0, 20).map(lead => (
              <SelectItem key={lead.id} value={lead.id}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lead.business_name}</span>
                  <span className="text-muted-foreground text-xs">• {lead.city}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Channel Tabs */}
      <Tabs value={activeChannel} onValueChange={setActiveChannel} className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger 
            value="whatsapp" 
            className="gap-2"
            disabled={selectedLead && !canSend.whatsapp}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger 
            value="email"
            className="gap-2"
            disabled={selectedLead && !canSend.email}
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger 
            value="instagram"
            className="gap-2"
            disabled={selectedLead && !canSend.instagram}
          >
            <Instagram className="w-4 h-4" />
            <span className="hidden sm:inline">Instagram</span>
          </TabsTrigger>
          <TabsTrigger value="facebook" className="gap-2">
            <Facebook className="w-4 h-4" />
            <span className="hidden sm:inline">Facebook</span>
          </TabsTrigger>
        </TabsList>

        {/* Email Subject (only for email) */}
        <TabsContent value="email" className="mt-0 mb-4">
          <Label className="text-sm text-muted-foreground mb-2 block">Assunto</Label>
          <Input 
            placeholder="Assunto do email..."
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
          />
        </TabsContent>

        {/* Message Area (same for all channels) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Mensagem</Label>
            <div className="flex gap-2">
              <TemplateSelector 
                channel={activeChannel} 
                onSelectTemplate={handleSelectTemplate}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateAI}
                disabled={!selectedLead || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>
          </div>

          <Textarea 
            placeholder={`Digite sua mensagem para ${activeChannel}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[150px]"
          />

          {/* Schedule Option */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Agendar envio</span>
            </div>
            <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
          </div>

          {isScheduled && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input 
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="flex-1"
              />
            </div>
          )}

          {/* Send Button */}
          <Button 
            className="w-full gradient-primary gap-2"
            disabled={!selectedLead || !message || isSending}
            onClick={handleSend}
          >
            {isSending ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {isScheduled ? 'Agendar Mensagem' : 'Enviar Agora'}
              </>
            )}
          </Button>

          {/* Channel-specific warnings */}
          {selectedLead && !canSend[activeChannel as keyof typeof canSend] && (
            <p className="text-sm text-destructive text-center">
              {activeChannel === 'whatsapp' && 'Este lead não tem WhatsApp disponível'}
              {activeChannel === 'email' && 'Este lead não tem email cadastrado'}
              {activeChannel === 'instagram' && 'Este lead não tem Instagram cadastrado'}
            </p>
          )}
        </div>
      </Tabs>
    </Card>
  );
}
