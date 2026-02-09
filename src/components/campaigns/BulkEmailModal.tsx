
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, CalendarClock, AlertCircle, Wand2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BulkEmailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLeads: string[]; // IDs
    onSuccess?: () => void;
}

export function BulkEmailModal({ open, onOpenChange, selectedLeads, onSuccess }: BulkEmailModalProps) {
    const { toast } = useToast();
    const [sequences, setSequences] = useState<any[]>([]);
    const [selectedSequenceId, setSelectedSequenceId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isCreatingSequence, setIsCreatingSequence] = useState(false);

    useEffect(() => {
        if (open) {
            fetchSequences();
        }
    }, [open]);

    const fetchSequences = async () => {
        setIsFetching(true);
        const { data } = await supabase.from('engagement_sequences').select('id, name, sequence_steps(count)');
        if (data) setSequences(data);
        setIsFetching(false);
    };

    const handleAutoCreateSequence = async () => {
        setIsCreatingSequence(true);
        try {
            // 1. Get user's company_id
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            const companyId = profile?.company_id;

            // 2. Generate sequence via AI
            toast({ title: '🤖 Gerando sequência com IA...', description: 'Aguarde alguns segundos.' });

            const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-sequence-ai', {
                body: {
                    niche: 'Desentupidora',
                    audience: 'Dono de Pequena Empresa',
                    tone: 'Profissional e Direto'
                }
            });

            if (aiError) throw aiError;

            if (!aiData.sequence || !Array.isArray(aiData.sequence)) {
                throw new Error('Resposta inválida da IA');
            }

            const steps = aiData.sequence;
            console.log('IA gerou', steps.length, 'passos');

            // 3. Create sequence in database
            const sequenceName = `Prospecção FlowDrain - ${new Date().toLocaleDateString('pt-BR')}`;

            const { data: seqData, error: seqError } = await supabase
                .from('engagement_sequences')
                .insert({
                    name: sequenceName,
                    description: 'Sequência gerada automaticamente via IA',
                    is_active: true,
                    company_id: companyId,
                    steps: [] // Required column
                })
                .select()
                .single();

            if (seqError) throw seqError;

            // 4. Create steps in database
            const stepsToInsert = steps.map((step: any, index: number) => ({
                sequence_id: seqData.id,
                step_order: index + 1,
                type: 'email',
                delay_days: step.day,
                content: {
                    subject: step.subject,
                    body: step.body
                }
            }));

            const { error: stepsError } = await supabase
                .from('sequence_steps')
                .insert(stepsToInsert);

            if (stepsError) throw stepsError;

            // 5. Refresh sequences list and auto-select the new one
            await fetchSequences();
            setSelectedSequenceId(seqData.id);

            toast({
                title: '✅ Sequência criada!',
                description: `${steps.length} emails prontos para envio. Clique em "Iniciar Agendamento".`,
            });

        } catch (error: any) {
            console.error('Erro ao criar sequência:', error);
            toast({
                title: 'Erro ao criar sequência',
                description: error.message || 'Tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingSequence(false);
        }
    };

    const handleSchedule = async () => {
        if (!selectedSequenceId) return;
        setIsLoading(true);

        try {
            // 1. Verify the sequence has steps
            const { data: steps } = await supabase
                .from('sequence_steps')
                .select('id')
                .eq('sequence_id', selectedSequenceId);

            if (!steps || steps.length === 0) {
                throw new Error('Esta sequência não tem passos.');
            }

            // 2. Get current user and company
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (!profile?.company_id) throw new Error('Company não encontrada');

            // 3. Create enrollments in lead_sequences
            const now = new Date();
            const enrollments = selectedLeads.map(leadId => ({
                lead_id: leadId,
                sequence_id: selectedSequenceId,
                company_id: profile.company_id,
                enrolled_by: user.id,
                current_step: 0,
                status: 'active',
                started_at: now.toISOString(),
                next_step_at: now.toISOString(),
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

            // 4. Trigger immediate processing
            try {
                await supabase.functions.invoke('process-sequence-queue');
            } catch (e) {
                console.warn('Could not trigger immediate processing:', e);
            }

            toast({
                title: '✅ Sequência Iniciada!',
                description: `${selectedLeads.length} leads inscritos. O primeiro email será enviado em breve.`,
            });

            onOpenChange(false);
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Erro ao iniciar',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const hasNoSequences = !isFetching && sequences.length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agendar Campanha de Email</DialogTitle>
                    <DialogDescription>
                        Você selecionou <strong>{selectedLeads.length} leads</strong> para receberem uma sequência.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {hasNoSequences ? (
                        // No sequences - show auto-create option
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Nenhuma sequência encontrada</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Deixe a IA criar uma sequência de 7 dias automaticamente para você.
                                </p>
                            </div>
                            <Button
                                onClick={handleAutoCreateSequence}
                                disabled={isCreatingSequence}
                                className="w-full gap-2 gradient-primary shadow-glow"
                            >
                                {isCreatingSequence ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Gerando com IA...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        Criar Sequência Automaticamente
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        // Has sequences - show selection
                        <>
                            <div className="space-y-2">
                                <Label>Escolha a Sequência</Label>
                                <Select value={selectedSequenceId} onValueChange={setSelectedSequenceId} disabled={isFetching}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sequences.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAutoCreateSequence}
                                disabled={isCreatingSequence}
                                className="w-full gap-2"
                            >
                                {isCreatingSequence ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-4 h-4" />
                                        + Criar Nova Sequência com IA
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    <Alert className="bg-muted/50">
                        <CalendarClock className="h-4 w-4" />
                        <AlertTitle>Envio Inteligente</AlertTitle>
                        <AlertDescription className="text-xs text-muted-foreground mt-1">
                            Para evitar bloqueios, o sistema enviará no máximo <strong>99 emails por dia</strong> automaticamente.
                            Sua campanha será distribuída ao longo dos próximos dias.
                        </AlertDescription>
                    </Alert>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSchedule} disabled={isLoading || !selectedSequenceId || isCreatingSequence}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Iniciar Agendamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
