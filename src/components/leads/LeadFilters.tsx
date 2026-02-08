import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useCampaigns } from "@/hooks/useCampaigns";

export interface LeadFiltersState {
    campaign: string;
    stage: string;
    scoreRange: [number, number];
    hasWhatsapp: boolean | 'all';
    hasEmail: boolean | 'all';
    minRating: number;
    state: string;
}

interface LeadFiltersProps {
    filters: LeadFiltersState;
    setFilters: (filters: LeadFiltersState) => void;
    className?: string;
    totalResults: number;
}

export function LeadFilters({ filters, setFilters, className, totalResults }: LeadFiltersProps) {
    const { data: campaigns } = useCampaigns();

    // Função para resetar filtros
    const resetFilters = () => {
        setFilters({
            campaign: 'all',
            stage: 'all',
            scoreRange: [0, 100],
            hasWhatsapp: 'all',
            hasEmail: 'all',
            minRating: 0,
            state: 'all'
        });
    };

    // Funções de manipulação de estado individual
    const updateFilter = (key: keyof LeadFiltersState, value: any) => {
        setFilters({ ...filters, [key]: value });
    };

    // Estados brasileiros para filtro
    const brazilianStates = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    // Contagem de filtros ativos
    const activeFiltersCount = [
        filters.campaign !== 'all',
        filters.stage !== 'all',
        filters.hasWhatsapp !== 'all',
        filters.hasEmail !== 'all',
        filters.minRating > 0,
        filters.state !== 'all',
        filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100
    ].filter(Boolean).length;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className={`gap-2 ${className}`}>
                    <Filter className="w-4 h-4" />
                    Filtros
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex justify-between items-center">
                        Filtros Avançados
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground text-xs hover:text-foreground">
                            Limpar filtros
                        </Button>
                    </SheetTitle>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Campanha */}
                    <div className="space-y-2">
                        <Label>Campanha</Label>
                        <Select value={filters.campaign} onValueChange={(v) => updateFilter('campaign', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as campanhas</SelectItem>
                                {campaigns?.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Estágio */}
                    <div className="space-y-2">
                        <Label>Estágio do Funil</Label>
                        <Select value={filters.stage} onValueChange={(v) => updateFilter('stage', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os estágios</SelectItem>
                                <SelectItem value="new">Novo</SelectItem>
                                <SelectItem value="contacted">Contactado</SelectItem>
                                <SelectItem value="qualified">Qualificado</SelectItem>
                                <SelectItem value="proposal">Proposta</SelectItem>
                                <SelectItem value="won">Ganho</SelectItem>
                                <SelectItem value="lost">Perdido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Canais */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>WhatsApp</Label>
                            <Select value={filters.hasWhatsapp.toString()} onValueChange={(v) => updateFilter('hasWhatsapp', v === 'all' ? 'all' : v === 'true')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="true">Com WhatsApp</SelectItem>
                                    <SelectItem value="false">Sem WhatsApp</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Select value={filters.hasEmail.toString()} onValueChange={(v) => updateFilter('hasEmail', v === 'all' ? 'all' : v === 'true')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="true">Com E-mail</SelectItem>
                                    <SelectItem value="false">Sem E-mail</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Score */}
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <Label>Lead Score ({filters.scoreRange[0]} - {filters.scoreRange[1]})</Label>
                        </div>
                        <Slider
                            defaultValue={[0, 100]}
                            value={filters.scoreRange}
                            max={100}
                            step={1}
                            onValueChange={(v) => updateFilter('scoreRange', v as [number, number])}
                            className="py-4"
                        />
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                        <Label>Avaliação Mínima (Google Maps)</Label>
                        <Select value={filters.minRating.toString()} onValueChange={(v) => updateFilter('minRating', Number(v))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Qualquer nota" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">Qualquer nota</SelectItem>
                                <SelectItem value="3">3+ Estrelas</SelectItem>
                                <SelectItem value="4">4+ Estrelas</SelectItem>
                                <SelectItem value="4.5">4.5+ Estrelas</SelectItem>
                                <SelectItem value="5">5 Estrelas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Estado */}
                    <div className="space-y-2">
                        <Label>Estado (UF)</Label>
                        <Select value={filters.state} onValueChange={(v) => updateFilter('state', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Todos os estados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os estados</SelectItem>
                                {brazilianStates.map(uf => (
                                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    <SheetTrigger asChild>
                        <Button className="gradient-primary w-full sm:w-auto">
                            Ver {totalResults} Resultados
                        </Button>
                    </SheetTrigger>
                </div>

            </SheetContent>
        </Sheet>
    );
}
