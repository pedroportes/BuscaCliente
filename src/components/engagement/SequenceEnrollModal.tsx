
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Play, Mail, AlertCircle, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Lead {
    id: string;
    business_name: string;
    email: string | null;
    city: string | null;
    stage: string;
    campaign_id: string | null;
}

interface SequenceEnrollModalProps {
    sequenceId: string;
    sequenceName: string;
    open: boolean;
    onClose: () => void;
    onEnrolled: () => void;
}

export function SequenceEnrollModal({ sequenceId, sequenceName, open, onClose, onEnrolled }: SequenceEnrollModalProps) {
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [alreadyEnrolled, setAlreadyEnrolled] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (open) {
            fetchLeads();
            fetchAlreadyEnrolled();
        }
    }, [open, sequenceId]);

    const fetchLeads = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('id, business_name, email, city, stage, campaign_id')
                .order('business_name', { ascending: true });

            if (error) throw error;
            setLeads(data || []);
        } catch (error: any) {
            toast({ title: 'Erro ao carregar leads', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAlreadyEnrolled = async () => {
        try {
            const { data, error } = await supabase
                .from('lead_sequences')
                .select('lead_id')
                .eq('sequence_id', sequenceId)
                .in('status', ['active', 'paused']);

            if (error) throw error;
            setAlreadyEnrolled(new Set((data || []).map((d: any) => d.lead_id)));
        } catch (error: any) {
            console.error('Error fetching enrollments:', error);
        }
    };

    const toggleLead = (leadId: string) => {
        setSelectedLeadIds(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) {
                next.delete(leadId);
            } else {
                next.add(leadId);
            }
            return next;
        });
    };

    const selectAllWithEmail = () => {
        const withEmail = filteredLeads
            .filter(l => l.email && !alreadyEnrolled.has(l.id))
            .map(l => l.id);
        setSelectedLeadIds(new Set(withEmail));
    };

    const deselectAll = () => {
        setSelectedLeadIds(new Set());
    };

    const handleEnroll = async () => {
        if (selectedLeadIds.size === 0) return;

        setIsEnrolling(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Get company_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (!profile?.company_id) throw new Error('Company não encontrada');

            // Create enrollments
            const now = new Date();
            const enrollments = Array.from(selectedLeadIds).map(leadId => ({
                lead_id: leadId,
                sequence_id: sequenceId,
                company_id: profile.company_id,
                enrolled_by: user.id,
                current_step: 0,
                status: 'active',
                started_at: now.toISOString(),
                next_step_at: now.toISOString(), // Send first email immediately on next cron run
            }));

            const { error } = await supabase
                .from('lead_sequences')
                .insert(enrollments);

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Alguns leads já estão inscritos nesta sequência.');
                }
                throw error;
            }

            toast({
                title: '✅ Leads inscritos com sucesso!',
                description: `${selectedLeadIds.size} leads adicionados à sequência "${sequenceName}". O primeiro email será enviado em breve.`,
            });

            // Trigger immediate processing
            try {
                await supabase.functions.invoke('process-sequence-queue');
                console.log('Triggered initial sequence processing');
            } catch (e) {
                console.warn('Could not trigger immediate processing:', e);
            }

            onEnrolled();
            onClose();
        } catch (error: any) {
            console.error('Enrollment error:', error);
            toast({
                title: 'Erro ao inscrever leads',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsEnrolling(false);
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.city && lead.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const leadsWithEmail = filteredLeads.filter(l => l.email);
    const leadsWithoutEmail = filteredLeads.filter(l => !l.email);
    const selectedCount = selectedLeadIds.size;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Play className="w-5 h-5 text-green-500" />
                        Iniciar Sequência: {sequenceName}
                    </DialogTitle>
                    <DialogDescription>
                        Selecione os leads que receberão os emails desta sequência. Cada lead receberá 1 email por dia.
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar leads por nome, email ou cidade..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Selection actions */}
                <div className="flex items-center gap-2 text-sm">
                    <Button variant="outline" size="sm" onClick={selectAllWithEmail}>
                        Selecionar todos com email ({leadsWithEmail.filter(l => !alreadyEnrolled.has(l.id)).length})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                        Limpar seleção
                    </Button>
                    {selectedCount > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                            <Users className="w-3 h-3 mr-1" />
                            {selectedCount} selecionados
                        </Badge>
                    )}
                </div>

                {/* Leads list */}
                <ScrollArea className="flex-1 min-h-0 max-h-[400px] border rounded-md">
                    <div className="p-2 space-y-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Carregando leads...
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum lead encontrado.
                            </div>
                        ) : (
                            <>
                                {/* Leads with email first */}
                                {leadsWithEmail.map(lead => {
                                    const isAlready = alreadyEnrolled.has(lead.id);
                                    return (
                                        <div
                                            key={lead.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${isAlready ? 'opacity-50' : ''
                                                } ${selectedLeadIds.has(lead.id) ? 'bg-primary/5 border border-primary/20' : ''}`}
                                            onClick={() => !isAlready && toggleLead(lead.id)}
                                        >
                                            <Checkbox
                                                checked={selectedLeadIds.has(lead.id)}
                                                disabled={isAlready}
                                                onCheckedChange={() => !isAlready && toggleLead(lead.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate">{lead.business_name}</span>
                                                    {isAlready && (
                                                        <Badge variant="outline" className="text-xs shrink-0">Já inscrito</Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex gap-2">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {lead.email}
                                                    </span>
                                                    {lead.city && <span>• {lead.city}</span>}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs capitalize shrink-0">
                                                {lead.stage === 'new' ? 'Novo' :
                                                    lead.stage === 'contacted' ? 'Contatado' :
                                                        lead.stage === 'qualified' ? 'Qualificado' :
                                                            lead.stage}
                                            </Badge>
                                        </div>
                                    );
                                })}

                                {/* Leads without email */}
                                {leadsWithoutEmail.length > 0 && (
                                    <>
                                        <div className="flex items-center gap-2 pt-4 pb-2 px-3 text-xs text-muted-foreground">
                                            <AlertCircle className="w-3 h-3" />
                                            Leads sem email ({leadsWithoutEmail.length}) — serão ignorados nos envios
                                        </div>
                                        {leadsWithoutEmail.map(lead => (
                                            <div
                                                key={lead.id}
                                                className="flex items-center gap-3 p-3 rounded-lg opacity-40"
                                            >
                                                <Checkbox disabled checked={false} />
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium truncate">{lead.business_name}</span>
                                                    <div className="text-xs text-muted-foreground">
                                                        Sem email cadastrado
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleEnroll}
                        disabled={selectedCount === 0 || isEnrolling}
                        className="gap-2 gradient-primary shadow-glow"
                    >
                        {isEnrolling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Inscrevendo...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Iniciar Envios ({selectedCount} leads)
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
