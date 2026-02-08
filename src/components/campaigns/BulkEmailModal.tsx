
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, CalendarClock, AlertCircle } from 'lucide-react';
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

    const handleSchedule = async () => {
        if (!selectedSequenceId) return;
        setIsLoading(true);

        try {
            // 1. Fetch Steps for the selected sequence
            const { data: steps } = await supabase
                .from('sequence_steps')
                .select('id, delay_days')
                .eq('sequence_id', selectedSequenceId)
                .order('step_order');

            if (!steps || steps.length === 0) {
                throw new Error('Esta sequência não tem passos.');
            }

            // 2. Prepare Payload
            const queueItems = [];
            const now = new Date(); // Start date is NOW

            for (const leadId of selectedLeads) {
                for (const step of steps) {
                    // Calculate scheduled date based on delay
                    // delay_days = 0 (Immediate), 1 (Next day), etc.
                    const scheduledFor = new Date(now);
                    scheduledFor.setDate(scheduledFor.getDate() + (step.delay_days || 0));
                    // Set to a reasonable time? E.g. 9 AM? 
                    // For now, let's keep relative to "now" but respect the day.
                    // If delay=0, assume NOW.

                    queueItems.push({
                        lead_id: leadId,
                        sequence_step_id: step.id,
                        status: 'pending',
                        scheduled_for: scheduledFor.toISOString(),
                        // marketing_account_id? 
                    });
                }
            }

            console.log(`Inserting ${queueItems.length} items to queue...`);

            // 3. Batch Insert (Supabase handles batching, but let's be safe with chunking if huge)
            const chunkSize = 1000;
            for (let i = 0; i < queueItems.length; i += chunkSize) {
                const chunk = queueItems.slice(i, i + chunkSize);
                // @ts-ignore
                const { error } = await supabase.from('campaign_queue').insert(chunk);
                if (error) throw error;
            }

            toast({
                title: 'Campanha Agendada!',
                description: `${selectedLeads.length} leads foram enfileirados. O sistema enviará respeitando o limite diário.`,
            });

            onOpenChange(false);
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error(error);
            toast({
                title: 'Erro ao agendar',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

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
                    <div className="space-y-2">
                        <Label>Escolha a Sequência</Label>
                        <Select value={selectedSequenceId} onValueChange={setSelectedSequenceId} disabled={isFetching}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sequences.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        Nenhuma sequência encontrada.<br />
                                        <Button variant="link" className="h-auto p-0 text-primary" onClick={() => onOpenChange(false)}>
                                            Vá em Engajamento {'>'} Sequências para criar.
                                        </Button>
                                    </div>
                                ) : (
                                    sequences.map(s => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name} ({s.sequence_steps[0]?.count || 0} passos)
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

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
                    <Button onClick={handleSchedule} disabled={isLoading || !selectedSequenceId}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Iniciar Agendamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
