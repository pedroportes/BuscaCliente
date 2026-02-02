import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Search, MapPin, Target } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrapingProgressModal } from '@/components/campaign/ScrapingProgressModal';
import { cn } from '@/lib/utils';

const niches = [
  { id: 'desentupidora', label: 'Desentupidora' },
  { id: 'limpeza-caixa', label: "Limpeza de Caixa D'água" },
  { id: 'hidrojateamento', label: 'Hidrojateamento' },
  { id: 'caca-vazamentos', label: 'Caça Vazamentos' },
  { id: 'dedetizacao', label: 'Dedetização' },
];

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  location: z.string().min(3, 'Informe a cidade e estado'),
  radius: z.number().min(5).max(50),
  niches: z.array(z.string()).min(1, 'Selecione pelo menos um nicho'),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: 'Básico' },
  { id: 2, title: 'Busca' },
  { id: 3, title: 'Revisar' },
];

export default function NewCampaign() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      location: '',
      radius: 20,
      niches: [],
    },
  });

  const watchedValues = form.watch();

  const canProceedToStep2 = watchedValues.name?.length >= 3;
  const canProceedToStep3 = 
    watchedValues.location?.length >= 3 && 
    watchedValues.niches?.length >= 1;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleScrapingComplete = (leadsCount: number) => {
    console.log(`Scraping completed with ${leadsCount} leads`);
    // In real app, would save to Supabase here
    navigate('/campaigns');
  };

  const handleStartSearch = () => {
    setIsSearching(true);
  };

  return (
    <AppLayout title="Nova Campanha" subtitle="Configure sua busca de leads em 3 passos simples">
      <div className="max-w-3xl mx-auto">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                      currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm mt-2 font-medium",
                      currentStep >= step.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-1 flex-1 mx-4 rounded-full transition-all",
                      currentStep > step.id ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          {/* Step 1 - Básico */}
          {currentStep === 1 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dê um nome para sua campanha de prospecção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Campanha *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Desentupidoras São Paulo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o objetivo desta campanha..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedToStep2}
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2 - Busca */}
          {currentStep === 2 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Configurar Busca
                </CardTitle>
                <CardDescription>
                  Defina a localização e os nichos de atuação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade, Estado *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Curitiba, PR"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="radius"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Raio de Busca: <span className="font-bold text-primary">{field.value} km</span>
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={5}
                          max={50}
                          step={5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>5 km</span>
                        <span>50 km</span>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="niches"
                  render={() => (
                    <FormItem>
                      <FormLabel>Nichos de Atuação *</FormLabel>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        {niches.map((niche) => (
                          <FormField
                            key={niche.id}
                            control={form.control}
                            name="niches"
                            render={({ field }) => (
                              <FormItem
                                className={cn(
                                  "flex items-center space-x-3 space-y-0 rounded-lg border p-4 cursor-pointer transition-all hover:border-primary",
                                  field.value?.includes(niche.id) && "border-primary bg-primary/5"
                                )}
                                onClick={() => {
                                  const current = field.value || [];
                                  if (current.includes(niche.id)) {
                                    field.onChange(current.filter((id) => id !== niche.id));
                                  } else {
                                    field.onChange([...current, niche.id]);
                                  }
                                }}
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(niche.id)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, niche.id]);
                                      } else {
                                        field.onChange(current.filter((id) => id !== niche.id));
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="cursor-pointer font-normal">
                                  {niche.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceedToStep3}
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3 - Revisar */}
          {currentStep === 3 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Revisar Campanha
                </CardTitle>
                <CardDescription>
                  Confira os dados antes de iniciar a busca
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome da Campanha</span>
                    <p className="font-semibold text-lg">{watchedValues.name}</p>
                  </div>

                  {watchedValues.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Descrição</span>
                      <p className="text-foreground">{watchedValues.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Localização</span>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        {watchedValues.location}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Raio</span>
                      <p className="font-medium">{watchedValues.radius} km</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Nichos Selecionados</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchedValues.niches?.map((nicheId) => {
                        const niche = niches.find((n) => n.id === nicheId);
                        return (
                          <Badge key={nicheId} variant="secondary" className="bg-primary/10 text-primary">
                            {niche?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Estimativa de leads</span>
                      <span className="text-2xl font-bold text-primary">~50 leads</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Voltar
                  </Button>
                  <Button type="button" onClick={handleStartSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Iniciar Busca
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </Form>
      </div>

      {/* Scraping Progress Modal */}
      <ScrapingProgressModal 
        open={isSearching}
        location={watchedValues.location || ''}
        onComplete={handleScrapingComplete}
      />
    </AppLayout>
  );
}
