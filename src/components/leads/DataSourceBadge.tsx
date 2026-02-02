import { Globe, MapPin, Instagram, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';

interface DataSourceBadgeProps {
  source: Lead['email_source'];
}

const sourceConfig: Record<NonNullable<Lead['email_source']>, {
  label: string;
  icon: React.ElementType;
  tooltip: string;
  className: string;
}> = {
  website: {
    label: 'Site',
    icon: Globe,
    tooltip: 'Email extraído do website',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  google: {
    label: 'Google',
    icon: MapPin,
    tooltip: 'Email do Google Maps',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  instagram: {
    label: 'Insta',
    icon: Instagram,
    tooltip: 'Email do perfil Instagram',
    className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  },
  manual: {
    label: 'Manual',
    icon: Pencil,
    tooltip: 'Email adicionado manualmente',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  },
};

export function DataSourceBadge({ source }: DataSourceBadgeProps) {
  if (!source) return null;

  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            variant="secondary" 
            className={cn("gap-1 text-xs px-2 py-0.5 font-medium cursor-help", config.className)}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
