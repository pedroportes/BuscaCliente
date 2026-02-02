import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-success';
      case 'error': return 'text-destructive';
      case 'warning': return 'text-warning';
      default: return 'text-muted-foreground';
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-success" />
                Conectar WhatsApp
              </DialogTitle>
              <DialogDescription>
                Insira suas credenciais da API para habilitar funções reais.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Configuration Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instanceUrl">URL da Instância</Label>
                    <Input
                      id="instanceUrl"
                      placeholder="https://sua-api.exemplo.com"
                      value={localConfig.instanceUrl}
                      onChange={(e) => setLocalConfig(prev => ({ ...prev, instanceUrl: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        placeholder="Sua chave API..."
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

                  <div className="space-y-2">
                    <Label htmlFor="instanceName">Nome da Instância</Label>
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
                  <div className="p-4 bg-white rounded-lg flex flex-col items-center gap-2">
                    <p className="text-sm text-gray-600">Escaneie com seu WhatsApp</p>
                    <img 
                      src={qrCodeImage.startsWith('data:') ? qrCodeImage : `data:image/png;base64,${qrCodeImage}`} 
                      alt="QR Code" 
                      className="w-48 h-48"
                    />
                  </div>
                )}

                {/* Diagnostic Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      status.connected ? "bg-success animate-pulse" : "bg-muted-foreground"
                    )} />
                    <h4 className="font-medium">Diagnóstico Avançado (Client-Side)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Teste a conexão diretamente do seu navegador para a Evolution API. 
                    Útil para identificar bloqueios de CORS ou erros de configuração.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="default"
                      onClick={() => handleAction('test', testConnection)}
                      disabled={!localConfig.instanceUrl || !localConfig.apiKey || isLoading !== null}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      {isLoading === 'test' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      1. Testar Conexão API
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => handleAction('verify', verifyInstance)}
                      disabled={!isConfigured || isLoading !== null}
                      className="gap-2 bg-violet-500 hover:bg-violet-600"
                    >
                      {isLoading === 'verify' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wifi className="w-4 h-4" />
                      )}
                      2. Verificar Instância
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => handleAction('qrcode', generateQrCode)}
                      disabled={!isConfigured || isLoading !== null}
                      className="gap-2 bg-teal-500 hover:bg-teal-600"
                    >
                      {isLoading === 'qrcode' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <QrCode className="w-4 h-4" />
                      )}
                      3. Gerar QR Code
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => handleAction('pairing', generatePairingCode)}
                      disabled={!isConfigured || isLoading !== null}
                      className="gap-2 bg-amber-500 hover:bg-amber-600"
                    >
                      {isLoading === 'pairing' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                      4. Gerar Pairing Code
                    </Button>

                    <Button
                      variant="default"
                      onClick={() => handleAction('status', checkStatus)}
                      disabled={!isConfigured || isLoading !== null}
                      className="gap-2 bg-cyan-500 hover:bg-cyan-600"
                    >
                      {isLoading === 'status' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      5. Verificar Status
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={clearLogs}
                      disabled={isLoading !== null}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpar Logs
                    </Button>
                  </div>
                </div>

                {/* Logs */}
                {logs.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Logs de Diagnóstico</h4>
                    <div className="bg-muted/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-1 font-mono text-xs">
                        {logs.map((log) => (
                          <div key={log.id} className={cn("flex gap-2", getLogColor(log.type))}>
                            <span className="text-muted-foreground shrink-0">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {status.connected ? (
                      <Wifi className="w-4 h-4 text-success" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      Status: {status.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  {status.lastCheck && (
                    <span className="text-xs text-muted-foreground">
                      Última verificação: {status.lastCheck.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </ScrollArea>
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
