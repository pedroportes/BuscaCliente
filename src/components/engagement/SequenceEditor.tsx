
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Save, ArrowLeft, Loader2, Calendar, Mail, Plus, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface Step {
    day: number;
    subject: string;
    body: string;
}

interface SequenceEditorProps {
    sequenceId: string | null;
    onClose: () => void;
}

export function SequenceEditor({ sequenceId, onClose }: SequenceEditorProps) {
    // const supabase = useSupabaseClient();
    const { toast } = useToast();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [niche, setNiche] = useState('Desentupidora');
    const [audience, setAudience] = useState('Dono de Pequena Empresa');
    const [tone, setTone] = useState('Profissional e Direto');

    const [steps, setSteps] = useState<Step[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('ai'); // ai | editor
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');

    // Fetch user company_id and existing sequence if editing
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('company_id, full_name')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    setCompanyId(profile.company_id);
                    setUserName(profile.full_name || '');
                }
            }

            if (sequenceId) {
                try {
                    // Fetch sequence basic info
                    const { data: seq, error: seqError } = await supabase
                        .from('engagement_sequences')
                        .select('*')
                        .eq('id', sequenceId)
                        .single();

                    if (seqError) throw seqError;

                    setName(seq.name);
                    setDescription(seq.description || '');

                    // Fetch steps
                    const { data: dbSteps, error: stepsError } = await supabase
                        .from('sequence_steps')
                        .select('*')
                        .eq('sequence_id', sequenceId)
                        .order('step_order', { ascending: true });

                    if (stepsError) throw stepsError;

                    if (dbSteps && dbSteps.length > 0) {
                        const formattedSteps = dbSteps.map(s => ({
                            day: s.delay_days,
                            subject: s.content.subject,
                            body: s.content.body
                        }));
                        setSteps(formattedSteps);
                        setActiveTab('editor');
                    }
                } catch (error: any) {
                    console.error('Error loading sequence:', error);
                    toast({
                        title: 'Erro ao carregar sequência',
                        description: error.message,
                        variant: 'destructive'
                    });
                }
            }
        };
        init();
    }, [sequenceId]);

    const handleAddStep = () => {
        setSteps(prev => [...prev, {
            day: prev.length > 0 ? (prev[prev.length - 1].day + 2) : 0,
            subject: '',
            body: ''
        }]);
        setActiveTab('editor');
    };

    const handleDeleteStep = (index: number) => {
        setSteps(prev => prev.filter((_, i) => i !== index));
    };

    const generateSequence = async () => {
        if (!niche || !audience) {
            toast({ title: 'Preencha o nicho e o público', variant: 'destructive' });
            return;
        }

        setIsGenerating(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-sequence-ai', {
                body: { niche, audience, tone, userName }
            });

            console.log('Edge Function response:', { data, error });

            if (error) throw error;

            if (data?.error) {
                throw new Error(data.error);
            }

            if (data?.sequence && Array.isArray(data.sequence) && data.sequence.length > 0) {
                setSteps(data.sequence);
                setActiveTab('editor');
                toast({ title: 'Sequência gerada com sucesso!', description: `${data.sequence.length} emails criados.` });
            } else {
                console.error('Resposta inesperada da IA:', JSON.stringify(data));
                throw new Error('A IA não retornou emails. Tente novamente.');
            }
        } catch (error: any) {
            console.error('Erro na geração:', error);
            toast({
                title: 'Erro ao gerar sequência',
                description: error.message || 'Tente novamente.',
                variant: 'destructive'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const saveSequence = async () => {
        if (!name || steps.length === 0) {
            toast({ title: 'Defina um nome e gere os passos', variant: 'destructive' });
            return;
        }

        setIsSaving(true);
        try {
            let finalSequenceId = sequenceId;

            // 1. Save/Update Sequence
            if (sequenceId) {
                const { error: seqError } = await supabase
                    .from('engagement_sequences')
                    .update({
                        name,
                        description,
                        company_id: companyId
                    })
                    .eq('id', sequenceId);

                if (seqError) throw seqError;

                // Delete existing steps to replace them efficiently
                const { error: delError } = await supabase
                    .from('sequence_steps')
                    .delete()
                    .eq('sequence_id', sequenceId);

                if (delError) throw delError;
            } else {
                const { data: seqData, error: seqError } = await supabase
                    .from('engagement_sequences')
                    .insert({
                        name,
                        description,
                        is_active: true,
                        company_id: companyId,
                        steps: []
                    })
                    .select()
                    .single();

                if (seqError) throw seqError;
                finalSequenceId = seqData.id;
            }

            // 2. Insert Steps
            const stepsToInsert = steps.map((step, index) => ({
                sequence_id: finalSequenceId,
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

            toast({ title: 'Sequência salva com sucesso!' });
            onClose();
        } catch (error: any) {
            console.error('Error saving:', error);
            toast({
                title: 'Erro ao salvar',
                description: error.message,
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {sequenceId ? 'Editar Sequência' : 'Nova Sequência AI'}
                        </h2>
                        <p className="text-muted-foreground">
                            Configure os parâmetros e deixe a IA trabalhar.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {steps.length > 0 && (
                        <Button onClick={saveSequence} disabled={isSaving} className="gradient-primary shadow-glow">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Sequência
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="ai">Gerador IA</TabsTrigger>
                    <TabsTrigger value="editor">
                        Editor ({steps.length} passos)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ai" className="space-y-4">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome da Sequência</Label>
                                    <Input
                                        placeholder="Ex: Prospecção Padarias - Jan 2024"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição (Opcional)</Label>
                                    <Input
                                        placeholder="Sequência focada em dor de gestão..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                                <div className="space-y-2">
                                    <Label>Nicho Alvo</Label>
                                    <Select value={niche} onValueChange={setNiche}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Desentupidora">Desentupidora</SelectItem>
                                            <SelectItem value="Dedetizadora">Dedetizadora</SelectItem>
                                            <SelectItem value="Limpeza de Fossa">Limpeza de Fossa</SelectItem>
                                            <SelectItem value="Marido de Aluguel">Marido de Aluguel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Público Alvo (Cargo/Perfil)</Label>
                                    <Input
                                        value={audience}
                                        onChange={e => setAudience(e.target.value)}
                                        placeholder="Ex: Dono, Gerente Operacional"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tom de Voz</Label>
                                    <Select value={tone} onValueChange={setTone}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Profissional e Direto">Profissional e Direto</SelectItem>
                                            <SelectItem value="Amigável e Casual">Amigável e Casual</SelectItem>
                                            <SelectItem value="Urgente e Persuasivo">Urgente e Persuasivo</SelectItem>
                                            <SelectItem value="Autoridade (Especialista)">Autoridade</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between items-center gap-4">
                                <Button
                                    variant="outline"
                                    onClick={handleAddStep}
                                    type="button"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Adicionar Passo Manualmente
                                </Button>

                                <Button
                                    onClick={generateSequence}
                                    disabled={isGenerating}
                                    size="lg"
                                    className="w-full md:w-auto gradient-primary shadow-glow"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            A IA está escrevendo 7 emails...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5 mr-2" />
                                            Gerar Sequência FlowDrain (7 Dias)
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview/Teaser if empty */}
                    {steps.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground opacity-50">
                            <Mail className="w-16 h-16 mx-auto mb-4" />
                            <p>Configure os parâmetros acima e clique em Gerar para criar sua máquina de vendas.</p>
                            <p className="text-sm mt-2">Ou clique em "Adicionar Passo Manualmente" para começar do zero.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="editor" className="space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={handleAddStep} variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Passo
                        </Button>
                    </div>
                    <div className="grid gap-6">
                        {steps.map((step, index) => (
                            <Card key={index} className="relative overflow-hidden border-l-4 border-l-primary">
                                <div className="absolute top-0 right-0 p-2 bg-muted/50 rounded-bl-lg">
                                    <Badge variant="secondary" className="font-mono">
                                        Dia {step.day}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteStep(index)}
                                    >
                                        <Trash className="w-3 h-3" /> {/* Replace with Trash/X icon if preferred, using Mail as placeholder per existing imports or add Trash to imports */}
                                    </Button>
                                </div>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Assunto</Label>
                                        <Input
                                            value={step.subject}
                                            onChange={(e) => {
                                                const newSteps = [...steps];
                                                newSteps[index].subject = e.target.value;
                                                setSteps(newSteps);
                                            }}
                                            className="font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Corpo do Email</Label>
                                        <Textarea
                                            value={step.body}
                                            onChange={(e) => {
                                                const newSteps = [...steps];
                                                newSteps[index].body = e.target.value;
                                                setSteps(newSteps);
                                            }}
                                            rows={6}
                                            className="font-sans text-sm resize-y"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
