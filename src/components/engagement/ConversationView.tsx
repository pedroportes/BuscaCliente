import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  ExternalLink,
  MessageCircle,
  RefreshCw,
  User,
  Building2
} from 'lucide-react';
import { Lead } from '@/hooks/useLeads';
import { Message, useMessages } from '@/hooks/useMessages';
import { MessageStatusBadge } from './MessageStatusBadge';
import { ChannelIcon } from './ChannelIcon';
import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatPhoneForDisplay } from '@/lib/phoneUtils';

interface ConversationViewProps {
  lead: Lead | null;
  onMessageSent?: () => void;
}

export function ConversationView({ lead, onMessageSent }: ConversationViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: allMessages = [], isLoading, refetch } = useMessages();
  const { status: evolutionStatus, isConfigured: isEvolutionConfigured, sendWhatsAppMessage } = useEvolutionApi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Filter messages for the selected lead
  const leadMessages = allMessages.filter(msg => msg.lead_id === lead?.id);

  // Sort messages by date (oldest first for chat view)
  const sortedMessages = [...leadMessages].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateA - dateB;
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages.length]);

  // Create message mutation
  const createMessage = useMutation({
    mutationFn: async (messageData: {
      lead_id: string;
      body: string;
      channel: string;
      status: string;
      direction: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleSendMessage = async () => {
    if (!lead || !newMessage.trim()) {
      toast({ 
        title: 'Mensagem vazia', 
        description: 'Digite uma mensagem para enviar',
        variant: 'destructive' 
      });
      return;
    }

    if (!lead.phone) {
      toast({ 
        title: 'Lead sem telefone', 
        description: 'Este lead não possui número de telefone cadastrado',
        variant: 'destructive' 
      });
      return;
    }

    setIsSending(true);

    try {
      // First, save the message to the database
      const savedMessage = await createMessage.mutateAsync({
        lead_id: lead.id,
        body: newMessage.trim(),
        channel: 'whatsapp',
        status: 'pending',
        direction: 'outbound',
      });

      // Then try to send via Evolution API
      if (isEvolutionConfigured && evolutionStatus.connected) {
        const success = await sendWhatsAppMessage(lead.phone, newMessage.trim());
        
        if (success) {
          // Update message status to sent
          await supabase
            .from('messages')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', savedMessage.id);
          
          toast({ 
            title: 'Mensagem enviada!',
            description: `Enviada para ${lead.business_name}`,
          });
        } else {
          // Update message status to failed
          await supabase
            .from('messages')
            .update({ status: 'failed', error_message: 'Falha no envio via Evolution API' })
            .eq('id', savedMessage.id);
        }
      } else {
        // Evolution API not configured - mark as pending
        toast({ 
          title: 'Mensagem salva',
          description: 'Configure a Evolution API para enviar via WhatsApp',
          variant: 'default',
        });
      }

      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      onMessageSent?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ 
        title: 'Erro ao enviar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = sortedMessages.reduce((groups, message) => {
    const date = formatMessageDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (!lead) {
    return (
      <Card className="h-full bg-card border-0 shadow-md flex items-center justify-center">
        <div className="text-center text-muted-foreground p-8">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2">Selecione um lead</h3>
          <p className="text-sm">Escolha um lead para ver o histórico de conversas</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border-0 shadow-md flex flex-col overflow-hidden">
      {/* Lead Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{lead.business_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {lead.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lead.city}{lead.state && `, ${lead.state}`}
                  </span>
                )}
                {lead.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-warning text-warning" />
                    {lead.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            {lead.phone && (
              <a href={`tel:${lead.phone}`}>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}>
                <Button variant="outline" size="sm">
                  <Mail className="w-4 h-4" />
                </Button>
              </a>
            )}
          </div>
        </div>
        
        {/* Contact Info Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          {lead.phone && (
            <Badge variant="secondary" className="text-xs">
              <Phone className="w-3 h-3 mr-1" />
              {formatPhoneForDisplay(lead.phone)}
            </Badge>
          )}
          {lead.email && (
            <Badge variant="secondary" className="text-xs">
              <Mail className="w-3 h-3 mr-1" />
              {lead.email}
            </Badge>
          )}
          {lead.has_whatsapp && (
            <Badge variant="secondary" className="text-xs bg-success/10 text-success">
              <MessageCircle className="w-3 h-3 mr-1" />
              WhatsApp
            </Badge>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                <Skeleton className="h-16 w-3/4 rounded-lg" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedMessages).length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie a primeira mensagem para este lead</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, messages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                    {date}
                  </div>
                </div>
                
                {/* Messages for this date */}
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isOutbound = message.direction === 'outbound';
                    return (
                      <div 
                        key={message.id} 
                        className={cn("flex", isOutbound ? "justify-end" : "justify-start")}
                      >
                        <div 
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                            isOutbound 
                              ? "bg-primary text-primary-foreground rounded-br-md" 
                              : "bg-muted rounded-bl-md"
                          )}
                        >
                          {/* Channel indicator for outbound */}
                          {isOutbound && (
                            <div className="flex items-center gap-1 mb-1 opacity-70">
                              <ChannelIcon 
                                channel={message.channel as any} 
                                className="w-3 h-3" 
                              />
                              <span className="text-xs capitalize">{message.channel}</span>
                            </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                          
                          <div className={cn(
                            "flex items-center gap-2 mt-1",
                            isOutbound ? "justify-end" : "justify-start"
                          )}>
                            <span className="text-xs opacity-70">
                              {formatMessageTime(message.sent_at || message.created_at)}
                            </span>
                            {isOutbound && (
                              <MessageStatusBadge 
                                status={message.status as any}
                              />
                            )}
                          </div>
                          
                          {message.status === 'failed' && message.error_message && (
                            <p className="text-xs text-destructive mt-1 opacity-80">
                              {message.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-muted/30">
        {/* Connection Status */}
        {isEvolutionConfigured && !evolutionStatus.connected && (
          <div className="mb-3 p-2 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning">
            WhatsApp desconectado - mensagens serão salvas mas não enviadas
          </div>
        )}
        
        <div className="flex gap-2">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="px-4"
          >
            {isSending ? (
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </Card>
  );
}
