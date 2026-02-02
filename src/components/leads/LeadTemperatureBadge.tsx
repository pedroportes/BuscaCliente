import { Flame, Snowflake, Thermometer, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';

interface LeadTemperatureBadgeProps {
  temperature: Lead['lead_temperature'];
  size?: 'sm' | 'md';
}

const temperatureConfig: Record<Lead['lead_temperature'], {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  cold: {
    label: 'Frio',
    icon: Snowflake,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  warm: {
    label: 'Morno',
    icon: Thermometer,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  hot: {
    label: 'Quente',
    icon: Flame,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  converted: {
    label: 'Convertido',
    icon: Trophy,
    className: 'bg-success/20 text-success',
  },
};

export function LeadTemperatureBadge({ temperature, size = 'sm' }: LeadTemperatureBadgeProps) {
  const config = temperatureConfig[temperature];
  const Icon = config.icon;

  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "gap-1 font-medium",
        config.className,
        size === 'sm' && "text-xs px-2 py-0.5",
        size === 'md' && "text-sm px-3 py-1"
      )}
    >
      <Icon className={cn(size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />
      {config.label}
    </Badge>
  );
}