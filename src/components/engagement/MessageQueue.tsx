import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { ChannelIcon } from './ChannelIcon';
import { MessageStatusBadge } from './MessageStatusBadge';
import { mockMessages } from '@/data/mockMessages';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function MessageQueue() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.lead?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
                          msg.body.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = channelFilter === 'all' || msg.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Agora há pouco';
    if (hours < 24) return `${hours}h atrás`;
    if (hours < 48) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-card border-0 shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fila de Mensagens</h3>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar mensagens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="sent">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="read">Lido</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages List */}
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Nenhuma mensagem encontrada</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "p-4 hover:bg-muted/50 transition-colors",
                msg.status === 'failed' && "bg-destructive/5"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Channel Icon */}
                <div className="flex-shrink-0">
                  <ChannelIcon channel={msg.channel} showLabel />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-card-foreground truncate">
                      {msg.lead?.business_name || 'Lead removido'}
                    </span>
                    <MessageStatusBadge status={msg.status} />
                  </div>
                  
                  {msg.subject && (
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {msg.subject}
                    </p>
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {msg.body}
                  </p>

                  {msg.status === 'failed' && msg.error_message && (
                    <p className="text-xs text-destructive mt-1">
                      Erro: {msg.error_message}
                    </p>
                  )}

                  {msg.status === 'scheduled' && msg.scheduled_at && (
                    <p className="text-xs text-primary mt-1">
                      Agendado para: {formatScheduleDate(msg.scheduled_at)}
                    </p>
                  )}
                </div>

                {/* Meta & Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {msg.sent_at ? formatDate(msg.sent_at) : formatDate(msg.created_at)}
                  </span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2">
                        <ExternalLink className="w-4 h-4" />
                        Ver Lead
                      </DropdownMenuItem>
                      {msg.status === 'failed' && (
                        <DropdownMenuItem className="gap-2">
                          <RotateCcw className="w-4 h-4" />
                          Reenviar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 text-destructive">
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
