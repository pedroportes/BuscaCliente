import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, Circle, ChevronRight, Rocket, Target, MessageSquare, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLeadsCount } from '@/hooks/useLeads';
import { useCampaigns } from '@/hooks/useCampaigns';
import { cn } from '@/lib/utils';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    completed: boolean;
}

export function OnboardingChecklist() {
    const { data: totalLeads = 0 } = useLeadsCount();
    const { data: campaigns = [] } = useCampaigns();

    // Check if Evolution API is configured (stored in localStorage)
    const evolutionConfig = localStorage.getItem('evolution_api_config');
    const hasEvolutionConfigured = !!evolutionConfig;

    // Define onboarding steps
    const steps: OnboardingStep[] = [
        {
            id: 'campaign',
            title: 'Criar primeira campanha',
            description: 'Busque leads no Google Maps',
            icon: Target,
            href: '/campaigns/new',
            completed: campaigns.length > 0,
        },
        {
            id: 'leads',
            title: 'Captar leads',
            description: 'Tenha pelo menos 1 lead',
            icon: Rocket,
            href: '/leads',
            completed: totalLeads > 0,
        },
        {
            id: 'whatsapp',
            title: 'Conectar WhatsApp',
            description: 'Integre o Evolution API',
            icon: MessageSquare,
            href: '/settings?tab=integrations',
            completed: hasEvolutionConfigured,
        },
        {
            id: 'engage',
            title: 'Engajar lead',
            description: 'Envie sua primeira mensagem',
            icon: Zap,
            href: '/engagement',
            completed: false, // Could be enhanced with message count
        },
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const progress = (completedSteps / steps.length) * 100;

    // Don't show if all steps are completed
    if (completedSteps === steps.length) {
        return null;
    }

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Rocket className="w-5 h-5 text-primary" />
                            Primeiros passos
                        </CardTitle>
                        <CardDescription>Complete para aproveitar o máximo do BuscaCliente</CardDescription>
                    </div>
                    <span className="text-sm font-medium text-primary">{completedSteps}/{steps.length}</span>
                </div>
                <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-2">
                    {steps.map((step) => (
                        <Link
                            key={step.id}
                            to={step.href}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all",
                                step.completed
                                    ? "bg-success/10 text-success"
                                    : "bg-muted/50 hover:bg-muted"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center",
                                step.completed ? "bg-success text-white" : "bg-muted-foreground/20"
                            )}>
                                {step.completed ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <step.icon className="w-4 h-4 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={cn(
                                    "font-medium text-sm",
                                    step.completed ? "text-success line-through" : "text-foreground"
                                )}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                            </div>
                            {!step.completed && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
