import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, MessageCircle, Mail, Instagram, Facebook } from 'lucide-react';
import { mockTemplates, templateCategories } from '@/data/mockTemplates';
import { MessageTemplate } from '@/types';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  channel: string;
  onSelectTemplate: (template: MessageTemplate) => void;
}

export function TemplateSelector({ channel, onSelectTemplate }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTemplates = mockTemplates.filter(template => {
    const matchesChannel = channel === 'all' || template.channel === channel;
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
                          template.body.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesChannel && matchesSearch && matchesCategory;
  });

  const getChannelIcon = (ch: string) => {
    switch (ch) {
      case 'whatsapp': return <MessageCircle className="w-3 h-3" />;
      case 'email': return <Mail className="w-3 h-3" />;
      case 'instagram': return <Instagram className="w-3 h-3" />;
      case 'facebook': return <Facebook className="w-3 h-3" />;
      default: return null;
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return templateCategories.find(c => c.id === categoryId);
  };

  const handleSelect = (template: MessageTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="w-4 h-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Selecionar Template</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas categorias</SelectItem>
              {templateCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum template encontrado para este canal
              </div>
            ) : (
              filteredTemplates.map(template => {
                const category = getCategoryInfo(template.category);
                return (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelect(template)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "p-1.5 rounded",
                          template.channel === 'whatsapp' && "bg-green-500/10 text-green-600",
                          template.channel === 'email' && "bg-blue-500/10 text-blue-600",
                          template.channel === 'instagram' && "bg-pink-500/10 text-pink-600",
                          template.channel === 'facebook' && "bg-blue-600/10 text-blue-700",
                        )}>
                          {getChannelIcon(template.channel)}
                        </div>
                        <span className="font-medium">{template.name}</span>
                      </div>
                      {category && (
                        <Badge variant="outline" className="text-xs">
                          {category.name}
                        </Badge>
                      )}
                    </div>
                    
                    {template.subject && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Assunto:</span> {template.subject}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.body}
                    </p>
                    
                    {template.variables.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {template.variables.map(v => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {`{${v}}`}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
