import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, MessageSquare, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface QuickAction {
    icon: React.ElementType;
    label: string;
    description: string;
    href: string;
    gradient: string;
}

const actions: QuickAction[] = [
    {
        icon: Plus,
        label: 'Nova Campanha',
        description: 'Buscar leads no Google Maps',
        href: '/campaigns/new',
        gradient: 'from-primary to-primary/70',
    },
    {
        icon: Search,
        label: 'Ver Leads',
        description: 'Gerenciar leads captados',
        href: '/leads',
        gradient: 'from-success to-success/70',
    },
    {
        icon: MessageSquare,
        label: 'Engajar',
        description: 'Enviar mensagens',
        href: '/engagement',
        gradient: 'from-accent to-accent/70',
    },
    {
        icon: BarChart3,
        label: 'Relatórios',
        description: 'Ver métricas e resultados',
        href: '/reports',
        gradient: 'from-warning to-warning/70',
    },
];

export function QuickActions() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {actions.map((action) => (
                <Link key={action.label} to={action.href}>
                    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
                        <CardContent className="p-4 relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3`}>
                                <action.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                {action.label}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {action.description}
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
