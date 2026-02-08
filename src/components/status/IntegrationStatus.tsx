import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

export function IntegrationStatus() {
    const { status, isConfigured } = useEvolutionApi();

    if (!isConfigured) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/settings">
                            <Badge variant="outline" className="gap-1.5 text-muted-foreground border-dashed h-7 px-3 hover:bg-muted cursor-pointer transition-colors">
                                <WifiOff className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline font-medium">WhatsApp Off</span>
                            </Badge>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Integração não configurada. Clique para configurar.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (status.status === 'connected') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full h-7 cursor-default">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                            </span>
                            <span className="hidden sm:inline text-xs font-semibold text-success">Online</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>WhatsApp conectado e operando.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (status.status === 'disconnected' || status.status === 'qr_pending') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to="/settings">
                            <Badge variant="destructive" className="gap-1.5 h-7 px-3 animate-pulse cursor-pointer hover:bg-destructive/90">
                                <QrCode className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Reconectar</span>
                            </Badge>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>WhatsApp desconectado. Clique para ler QR Code.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Connecting or unknown
    return (
        <Badge variant="secondary" className="gap-1.5 h-7 px-3">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Conectando...</span>
        </Badge>
    );
}
