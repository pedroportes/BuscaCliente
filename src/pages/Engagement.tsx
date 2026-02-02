import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MessageComposer } from '@/components/engagement/MessageComposer';
import { ConversationView } from '@/components/engagement/ConversationView';
import { EngagementMetrics } from '@/components/engagement/EngagementMetrics';
import { useLeads, Lead } from '@/hooks/useLeads';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  Building2, 
  MapPin, 
  Phone,
  MessageCircle,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessages } from '@/hooks/useMessages';

export default function Engagement() {
  const { data: leads = [], isLoading: isLoadingLeads } = useLeads();
  const { data: messages = [] } = useMessages();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter leads by search term
  const filteredLeads = useMemo(() => {
    if (!searchTerm) return leads;
    const term = searchTerm.toLowerCase();
    return leads.filter(lead => 
      lead.business_name.toLowerCase().includes(term) ||
      lead.city?.toLowerCase().includes(term) ||
      lead.phone?.includes(term)
    );
  }, [leads, searchTerm]);

  // Get message count per lead
  const messageCountByLead = useMemo(() => {
    return messages.reduce((acc, msg) => {
      if (msg.lead_id) {
        acc[msg.lead_id] = (acc[msg.lead_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [messages]);

  // Get last message per lead for preview
  const lastMessageByLead = useMemo(() => {
    return messages.reduce((acc, msg) => {
      if (msg.lead_id) {
        if (!acc[msg.lead_id] || new Date(msg.created_at || 0) > new Date(acc[msg.lead_id].created_at || 0)) {
          acc[msg.lead_id] = msg;
        }
      }
      return acc;
    }, {} as Record<string, typeof messages[0]>);
  }, [messages]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  return (
    <AppLayout 
      title="Engajamento" 
      subtitle="Envie mensagens e gerencie interações com seus leads"
    >
      {/* Metrics */}
      <EngagementMetrics />

      {/* Main Content - Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Leads List - Left Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="h-full bg-card border-0 shadow-md flex flex-col overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold mb-3">Leads</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar lead..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Leads List */}
            <ScrollArea className="flex-1">
              {isLoadingLeads ? (
                <div className="p-2 space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-3">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhum lead encontrado</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredLeads.map((lead) => {
                    const lastMessage = lastMessageByLead[lead.id];
                    const messageCount = messageCountByLead[lead.id] || 0;
                    const isSelected = selectedLead?.id === lead.id;
                    
                    return (
                      <button
                        key={lead.id}
                        onClick={() => handleSelectLead(lead)}
                        className={cn(
                          "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                          isSelected && "bg-primary/5 border-l-2 border-primary"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                            isSelected ? "bg-primary/20" : "bg-muted"
                          )}>
                            <Building2 className={cn(
                              "w-5 h-5",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium truncate">
                                {lead.business_name}
                              </span>
                              {messageCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {messageCount}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {lead.city && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  {lead.city}
                                </span>
                              )}
                              {lead.rating && (
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 fill-warning text-warning" />
                                  {lead.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            
                            {lastMessage && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {lastMessage.body}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-1">
                              {lead.has_whatsapp && (
                                <MessageCircle className="w-3 h-3 text-success" />
                              )}
                              {lead.phone && (
                                <Phone className="w-3 h-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Conversation View - Center */}
        <div className="lg:col-span-8 xl:col-span-9">
          <ConversationView 
            lead={selectedLead} 
            onMessageSent={() => {}}
          />
        </div>
      </div>
    </AppLayout>
  );
}
