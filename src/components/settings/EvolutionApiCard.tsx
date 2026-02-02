import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle,
  Check, 
  X, 
  Eye, 
  EyeOff,
  TestTube,
  Loader2,
  Settings2,
  QrCode,
  Smartphone,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { cn } from '@/lib/utils';

export function EvolutionApiCard() {
  const {
    config,
    status,
    logs,
    isConfigured,
    saveConfig,
    testConnection,
    verifyInstance,
    generateQrCode,
    generatePairingCode,
    checkStatus,
    clearLogs,
  } = useEvolutionApi();

  const [isOpen, setIsOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLocalConfig(config);
      setQrCodeImage(null);
    }
  };

  const handleSaveConfig = () => {
    saveConfig(localConfig);
  };

  const handleAction = async (action: string, fn: () => Promise<unknown>) => {
    setIsLoading(action);
    try {
      const result = await fn();
      if (action === 'qrcode' && typeof result === 'string') {
        setQrCodeImage(result);
      }
    } finally {
      setIsLoading(null);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />;
      case 'error': return <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />;
      default: return <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <MessageCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <CardTitle className="text-lg">WhatsApp (Evolution API)</CardTitle>
              <CardDescription>Conecte sua instância do WhatsApp</CardDescription>
            </div>
          </div>
          <Badge 
            variant={status.connected ? "default" : "secondary"}
            className={status.connected ? "bg-success" : ""}
          >
            {status.connected ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <X className="w-3 h-3 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Settings2 className="w-4 h-4" />
              Configurar WhatsApp
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-success" />
                Conectar WhatsApp
              </DialogTitle>
              <DialogDescription>
                Configure sua Evolution API para enviar mensagens.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Configuration Fields */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="instanceUrl" className="text-sm">URL da Instância</Label>
                  <Input
                    id="instanceUrl"
                    placeholder="https://api.evolution.exemplo.com"
                    value={localConfig.instanceUrl}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, instanceUrl: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="apiKey" className="text-sm">API Key</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      placeholder="Sua chave de API..."
                      value={localConfig.apiKey}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instanceName" className="text-sm">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="minha-instancia"
                    value={localConfig.instanceName}
                    onChange={(e) => setLocalConfig(prev => ({ ...prev, instanceName: e.target.value }))}
                  />
                </div>

                <Button onClick={handleSaveConfig} className="w-full">
                  Salvar Configuração
                </Button>
              </div>

              {/* QR Code Display */}
              {qrCodeImage && (
                <div className="p-4 bg-white rounded-lg flex flex-col items-center gap-2 border">
                  <p className="text-sm text-muted-foreground">Escaneie com seu WhatsApp</p>
                  <img 
                    src={qrCodeImage.startsWith('data:') ? qrCodeImage : `data:image/png;base64,${qrCodeImage}`} 
                    alt="QR Code" 
                    className="w-40 h-40"
                  />
                </div>
              )}

              <Separator />

              {/* Diagnostic Actions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    status.connected ? "bg-success animate-pulse" : "bg-muted-foreground"
                  )} />
                  <span className="text-sm font-medium">Diagnóstico</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAction('test', testConnection)}
                    disabled={!localConfig.instanceUrl || !localConfig.apiKey || isLoading !== null}
                    className="gap-1.5"
                  >
                    {isLoading === 'test' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <TestTube className="w-3.5 h-3.5" />
                    )}
                    Testar API
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction('verify', verifyInstance)}
                    disabled={!isConfigured || isLoading !== null}
                    className="gap-1.5"
                  >
                    {isLoading === 'verify' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wifi className="w-3.5 h-3.5" />
                    )}
                    Verificar
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction('qrcode', generateQrCode)}
                    disabled={!isConfigured || isLoading !== null}
                    className="gap-1.5"
                  >
                    {isLoading === 'qrcode' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <QrCode className="w-3.5 h-3.5" />
                    )}
                    QR Code
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAction('pairing', generatePairingCode)}
                    disabled={!isConfigured || isLoading !== null}
                    className="gap-1.5"
                  >
                    {isLoading === 'pairing' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5" />
                    )}
                    Pairing
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('status', checkStatus)}
                    disabled={!isConfigured || isLoading !== null}
                    className="gap-1.5"
                  >
                    {isLoading === 'status' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Status
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearLogs}
                    disabled={isLoading !== null}
                    className="gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar
                  </Button>
                </div>
              </div>

              {/* Logs */}
              {logs.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Logs</Label>
                  <ScrollArea className="h-28 rounded-md border bg-muted/30 p-2">
                    <div className="space-y-1 text-xs font-mono">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-1.5">
                          {getLogIcon(log.type)}
                          <span className="text-muted-foreground shrink-0">
                            {log.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Connection Status Footer */}
              <div className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  {status.connected ? (
                    <Wifi className="w-4 h-4 text-success" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">
                    {status.connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                {status.lastCheck && (
                  <span className="text-xs text-muted-foreground">
                    {status.lastCheck.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {isConfigured && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Instância: {config.instanceName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
