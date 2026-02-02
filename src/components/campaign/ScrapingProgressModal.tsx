import { useState, useEffect } from 'react';
import { Check, Loader2, MapPin, Globe, Instagram, Mail, Database } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScrapingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'pending' | 'running' | 'completed';
  count?: number;
}

interface ScrapingProgressModalProps {
  open: boolean;
  location: string;
  onComplete: (leadsCount: number) => void;
}

export function ScrapingProgressModal({ open, location, onComplete }: ScrapingProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<ScrapingStep[]>([
    { id: 'google-maps', label: 'Buscando no Google Maps', icon: MapPin, status: 'pending', count: 0 },
    { id: 'websites', label: 'Acessando websites', icon: Globe, status: 'pending', count: 0 },
    { id: 'instagram', label: 'Verificando Instagram', icon: Instagram, status: 'pending', count: 0 },
    { id: 'emails', label: 'Extraindo emails', icon: Mail, status: 'pending', count: 0 },
    { id: 'saving', label: 'Salvando leads', icon: Database, status: 'pending', count: 0 },
  ]);
  const [totalLeads, setTotalLeads] = useState(0);

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setProgress(0);
      setCurrentStepIndex(0);
      setTotalLeads(0);
      setSteps(prev => prev.map(s => ({ ...s, status: 'pending', count: 0 })));
      return;
    }

    const stepDuration = 1200; // ms per step
    const totalSteps = 5;
    let elapsed = 0;

    const interval = setInterval(() => {
      elapsed += 100;
      const overallProgress = Math.min((elapsed / (stepDuration * totalSteps)) * 100, 100);
      setProgress(overallProgress);

      const currentStep = Math.floor(elapsed / stepDuration);
      setCurrentStepIndex(currentStep);

      // Update steps status and counts
      setSteps(prev => prev.map((step, index) => {
        if (index < currentStep) {
          return { ...step, status: 'completed' as const };
        } else if (index === currentStep) {
          // Generate random counts based on step
          const counts: Record<string, number> = {
            'google-maps': Math.floor(Math.random() * 20) + 40,
            'websites': Math.floor(Math.random() * 15) + 25,
            'instagram': Math.floor(Math.random() * 10) + 15,
            'emails': Math.floor(Math.random() * 8) + 12,
            'saving': 50,
          };
          return { 
            ...step, 
            status: 'running' as const,
            count: counts[step.id] || 0
          };
        }
        return step;
      }));

      // Update total leads found (animated)
      if (currentStep >= 0) {
        setTotalLeads(Math.min(Math.floor((elapsed / (stepDuration * 4)) * 50), 50));
      }

      if (elapsed >= stepDuration * totalSteps) {
        clearInterval(interval);
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        setTotalLeads(50);
        
        setTimeout(() => {
          onComplete(50);
        }, 800);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [open, onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col py-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Raspagem de Leads</h3>
            <p className="text-muted-foreground text-sm">
              Buscando empresas em <span className="font-medium text-foreground">{location}</span>
            </p>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex && step.status === 'running';
              const isCompleted = step.status === 'completed';
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    isActive && "bg-primary/10 border border-primary/20",
                    isCompleted && "bg-success/10",
                    step.status === 'pending' && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isCompleted && "bg-success text-success-foreground",
                    isActive && "bg-primary text-primary-foreground",
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
                      isCompleted && "text-success"
                    )}>
                      {step.label}
                    </p>
                  </div>
                  {(isActive || isCompleted) && step.count !== undefined && step.count > 0 && (
                    <span className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      isCompleted && "text-success"
                    )}>
                      {step.count} {step.id === 'saving' ? 'leads' : 'encontrados'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
              <span className="font-semibold text-primary">{totalLeads} leads encontrados</span>
            </div>
          </div>

          {/* Completion Message */}
          {progress >= 100 && (
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
