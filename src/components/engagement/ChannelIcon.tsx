import { MessageCircle, Mail, Instagram, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelIconProps {
  channel: 'whatsapp' | 'email' | 'instagram' | 'facebook';
  className?: string;
  showLabel?: boolean;
}

const channelConfig = {
  whatsapp: {
    icon: MessageCircle,
    label: 'WhatsApp',
    className: 'text-green-500',
    bgClassName: 'bg-green-500/10',
  },
  email: {
    icon: Mail,
    label: 'Email',
    className: 'text-blue-500',
    bgClassName: 'bg-blue-500/10',
  },
  instagram: {
    icon: Instagram,
    label: 'Instagram',
    className: 'text-pink-500',
    bgClassName: 'bg-pink-500/10',
  },
  facebook: {
    icon: Facebook,
    label: 'Facebook',
    className: 'text-blue-600',
    bgClassName: 'bg-blue-600/10',
  },
};

export function ChannelIcon({ channel, className, showLabel = false }: ChannelIconProps) {
  const config = channelConfig[channel];
  const Icon = config.icon;

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full", config.bgClassName, className)}>
        <Icon className={cn("w-4 h-4", config.className)} />
        <span className={cn("text-xs font-medium", config.className)}>{config.label}</span>
      </div>
    );
  }

  return <Icon className={cn("w-4 h-4", config.className, className)} />;
}
