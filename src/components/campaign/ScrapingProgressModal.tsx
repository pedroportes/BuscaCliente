import { useState, useEffect, useRef } from 'react';
import { Check, Loader2, MapPin, Database, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface ScrapingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'running' | 'completed' | 'error';
}

interface ScrapingProgressModalProps {
  open: boolean;
  location: string;
  niches: string[];
  campaignId?: string;
  companyId?: string;
  onComplete: (leadsCount: number) => void;
}

export function ScrapingProgressModal({ 
  open, location, niches, campaignId, companyId, onComplete 
}: ScrapingProgressModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasStarted = useRef(false);

  const [steps, setSteps] = useState<ScrapingStep[]>([
    { id: 'searching', label: 'Buscando no Google Maps', icon: Search, status: 'pending' },
    { id: 'saving', label: 'Salvando leads', icon: Database, status: 'pending' },
    { id: 'done', label: 'Concluído', icon: Check, status: 'pending' },
  ]);

  useEffect(() => {
    if (!open) {
      setCurrentStepIndex(0);
      setTotalLeads(0);
      setErrorMessage(null);
      hasStarted.current = false;
      setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));
      return;
    }

    if (hasStarted.current) return;
    hasStarted.current = true;

    const runSearch = async () => {
      // Step 1: Searching
      setCurrentStepIndex(0);
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'running' } : s));

      try {
        const { data, error } = await supabase.functions.invoke('search-leads', {
          body: {
            campaign_id: campaignId || null,
            company_id: companyId || null,
            search_location: location,
            search_niches: niches,
            max_results: 20,
          },
        });

        if (error) {
          throw new Error(error.message || 'Erro ao buscar leads');
        }

        if (!data?.success && data?.error) {
          throw new Error(data.error);
        }

        // Step 1 complete
        setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'completed' } : s));

        // Step 2: Saving
        setCurrentStepIndex(1);
        setSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'running' } : s));

        const savedCount = data?.leads_saved || 0;
        setTotalLeads(savedCount);

        // Simulate brief saving animation
        await new Promise(resolve => setTimeout(resolve, 500));
        setSteps(prev => prev.map((s, i) => i <= 1 ? { ...s, status: 'completed' } : s));

        // Step 3: Done
        setCurrentStepIndex(2);
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));

        setTimeout(() => {
          onComplete(savedCount);
        }, 1000);

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('[ScrapingModal] Error:', msg);
        setErrorMessage(msg);
        setSteps(prev => prev.map((s, i) => 
          i === currentStepIndex ? { ...s, status: 'error' } : s
        ));
      }
    };

    runSearch();
  }, [open, location, niches, campaignId, companyId, onComplete]);

  const progress = steps.filter(s => s.status === 'completed').length / steps.length * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col py-6 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Raspagem de Leads</h3>
            <p className="text-muted-foreground text-sm">
              Buscando empresas em <span className="font-medium text-foreground">{location}</span>
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.status === 'running';
              const isCompleted = step.status === 'completed';
              const isError = step.status === 'error';
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    isActive && "bg-primary/10 border border-primary/20",
                    isCompleted && "bg-success/10",
                    isError && "bg-destructive/10 border border-destructive/20",
                    step.status === 'pending' && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isCompleted && "bg-success text-success-foreground",
                    isActive && "bg-primary text-primary-foreground",
                    isError && "bg-destructive text-destructive-foreground",
                    step.status === 'pending' && "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-success",
                      isError && "text-destructive"
                    )}>
                      {step.label}
                    </p>
                  </div>
                  {isCompleted && step.id === 'saving' && totalLeads > 0 && (
                    <span className="text-sm font-medium text-success">
                      {totalLeads} leads
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
              <span className="font-semibold text-primary">{totalLeads} leads encontrados</span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <strong>Erro:</strong> {errorMessage}
            </div>
          )}

          {progress >= 100 && !errorMessage && (
            <div className="flex items-center justify-center gap-2 text-success animate-in fade-in">
              <Check className="h-5 w-5" />
              <span className="font-medium">Raspagem concluída! Redirecionando...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
