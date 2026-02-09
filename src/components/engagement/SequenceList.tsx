
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Wand2, Calendar, MoreVertical, Trash, Edit, Play, Users, Pause, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SequenceEditor } from './SequenceEditor';
import { SequenceEnrollModal } from './SequenceEnrollModal';

interface Sequence {
    id: string;
    name: string;
    description: string;
    created_at: string;
    steps_count?: number;
    active_enrollments?: number;
    completed_enrollments?: number;
}

export function SequenceList() {
    const { toast } = useToast();
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);
    const [enrollSequence, setEnrollSequence] = useState<{ id: string; name: string } | null>(null);

    useEffect(() => {
        fetchSequences();
    }, []);

    const fetchSequences = async () => {
        try {
            setIsLoading(true);
            // Fetch sequences
            const { data, error } = await supabase
                .from('engagement_sequences')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch step counts
            const sequenceIds = data.map((s: any) => s.id);
            const { data: stepCounts, error: stepsError } = await supabase
                .from('sequence_steps')
                .select('sequence_id')
                .in('sequence_id', sequenceIds);

            const countMap: Record<string, number> = {};
            if (!stepsError && stepCounts) {
                stepCounts.forEach((step: any) => {
                    countMap[step.sequence_id] = (countMap[step.sequence_id] || 0) + 1;
                });
            }

            // Fetch enrollment counts
            const { data: enrollments } = await supabase
                .from('lead_sequences')
                .select('sequence_id, status')
                .in('sequence_id', sequenceIds);

            const activeMap: Record<string, number> = {};
            const completedMap: Record<string, number> = {};
            if (enrollments) {
                enrollments.forEach((e: any) => {
                    if (e.status === 'active') {
                        activeMap[e.sequence_id] = (activeMap[e.sequence_id] || 0) + 1;
                    } else if (e.status === 'completed') {
                        completedMap[e.sequence_id] = (completedMap[e.sequence_id] || 0) + 1;
                    }
                });
            }

            const formatted = data.map((seq: any) => ({
                ...seq,
                steps_count: countMap[seq.id] || 0,
                active_enrollments: activeMap[seq.id] || 0,
                completed_enrollments: completedMap[seq.id] || 0,
            }));

            setSequences(formatted);
        } catch (error: any) {
            console.error('Error fetching sequences:', error);
            toast({
                title: 'Erro ao carregar sequências',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta sequência?')) return;

        try {
            const { error } = await supabase
                .from('engagement_sequences')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setSequences(prev => prev.filter(s => s.id !== id));
            toast({ title: 'Sequência excluída com sucesso' });
        } catch (error: any) {
            toast({
                title: 'Erro ao excluir',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const openEnrollModal = (sequence: Sequence) => {
        setEnrollSequence({ id: sequence.id, name: sequence.name });
        setEnrollModalOpen(true);
    };

    if (isEditing) {
        return (
            <SequenceEditor
                sequenceId={selectedSequenceId}
                onClose={() => {
                    setIsEditing(false);
                    setSelectedSequenceId(null);
                    fetchSequences();
                }}
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Sequências de Engajamento</h2>
                    <p className="text-muted-foreground">
                        Crie fluxos automáticos de email para nutrir seus leads.
                    </p>
                </div>
                <Button onClick={() => setIsEditing(true)} className="gap-2 gradient-primary shadow-glow">
                    <Wand2 className="w-4 h-4" />
                    Gerar com IA FlowDrain
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sequences.map((sequence) => (
                    <Card key={sequence.id} className="hover:shadow-md transition-shadow relative group">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-semibold truncate pr-8">
                                    {sequence.name}
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-4 right-4">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                            setSelectedSequenceId(sequence.id);
                                            setIsEditing(true);
                                        }}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => handleDelete(sequence.id)}
                                        >
                                            <Trash className="w-4 h-4 mr-2" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardDescription className="line-clamp-2 min-h-[40px]">
                                {sequence.description || 'Sem descrição'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Stats */}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground pb-3">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-primary">{sequence.steps_count}</span>
                                    Passos
                                </div>
                                {(sequence.active_enrollments ?? 0) > 0 && (
                                    <Badge variant="default" className="gap-1 text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                        <Users className="w-3 h-3" />
                                        {sequence.active_enrollments} ativos
                                    </Badge>
                                )}
                                {(sequence.completed_enrollments ?? 0) > 0 && (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                        <CheckCircle className="w-3 h-3" />
                                        {sequence.completed_enrollments}
                                    </Badge>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(sequence.created_at).toLocaleDateString()}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => openEnrollModal(sequence)}
                                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                                    disabled={(sequence.steps_count ?? 0) === 0}
                                >
                                    <Play className="w-3.5 h-3.5" />
                                    Iniciar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State */}
                {sequences.length === 0 && !isLoading && (
                    <Card className="col-span-full border-dashed p-8 flex flex-col items-center justify-center text-center bg-muted/20">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Wand2 className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Nenhuma sequência criada</h3>
                        <p className="text-muted-foreground mb-4 max-w-sm">
                            Use a Inteligência Artificial do FlowDrain para criar uma sequência persuasiva de 7 dias em segundos.
                        </p>
                        <Button onClick={() => setIsEditing(true)} variant="outline">
                            Criar Primeira Sequência
                        </Button>
                    </Card>
                )}
            </div>

            {/* Enroll Modal */}
            {enrollSequence && (
                <SequenceEnrollModal
                    sequenceId={enrollSequence.id}
                    sequenceName={enrollSequence.name}
                    open={enrollModalOpen}
                    onClose={() => {
                        setEnrollModalOpen(false);
                        setEnrollSequence(null);
                    }}
                    onEnrolled={fetchSequences}
                />
            )}
        </div>
    );
}
