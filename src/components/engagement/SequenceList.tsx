
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Wand2, Calendar, MoreVertical, Trash, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SequenceEditor } from './SequenceEditor';

interface Sequence {
    id: string;
    name: string;
    description: string;
    created_at: string;
    steps_count?: number;
}

export function SequenceList() {
    // const supabase = useSupabaseClient();
    const { toast } = useToast();
    const [sequences, setSequences] = useState<Sequence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedSequenceId, setSelectedSequenceId] = useState<string | null>(null);

    useEffect(() => {
        fetchSequences();
    }, []);

    const fetchSequences = async () => {
        try {
            setIsLoading(true);
            // Fetch sequences and count steps
            const { data, error } = await supabase
                .from('engagement_sequences')
                .select('*, sequence_steps(count)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted = data.map((seq: any) => ({
                ...seq,
                steps_count: seq.sequence_steps?.[0]?.count || 0
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
                            <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-primary">{sequence.steps_count}</span>
                                    Passos
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(sequence.created_at).toLocaleDateString()}
                                </div>
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
        </div>
    );
}
