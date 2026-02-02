import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Eye, 
  EyeOff,
  TestTube,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EvolutionApiCard } from './EvolutionApiCard';

interface ApiIntegration {
  id: string;
  name: string;
  description: string;
  keyName: string;
  icon: React.ReactNode;
}

const integrations: ApiIntegration[] = [
  {
    id: 'google-places',
    name: 'Google Places API',
    description: 'Busca de leads em tempo real',
    keyName: 'GOOGLE_PLACES_API_KEY',
    icon: <div className="p-2 rounded-lg bg-blue-500/10"><span className="text-blue-500 text-lg">🗺️</span></div>,
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini API',
    description: 'Geração de copy com IA',
    keyName: 'GOOGLE_GEMINI_API_KEY',
    icon: <div className="p-2 rounded-lg bg-purple-500/10"><span className="text-purple-500 text-lg">✨</span></div>,
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Envio de emails transacionais',
    keyName: 'RESEND_API_KEY',
    icon: <div className="p-2 rounded-lg bg-teal-500/10"><span className="text-teal-500 text-lg">📧</span></div>,
  },
];

export function IntegrationsTab() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectedApis, setConnectedApis] = useState<Record<string, boolean>>({});

  const handleApiKeyChange = (integrationId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [integrationId]: value }));
  };

  const toggleShowKey = (integrationId: string) => {
    setShowKeys(prev => ({ ...prev, [integrationId]: !prev[integrationId] }));
  };

  const testConnection = async (integrationId: string) => {
    setTestingConnection(integrationId);
    
    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.3; // 70% chance de sucesso
    
    if (success) {
      setConnectedApis(prev => ({ ...prev, [integrationId]: true }));
      toast({
        title: "Conexão bem-sucedida!",
        description: "A API está configurada corretamente.",
      });
    } else {
      setConnectedApis(prev => ({ ...prev, [integrationId]: false }));
      toast({
        title: "Falha na conexão",
        description: "Verifique se a chave API está correta.",
        variant: "destructive",
      });
    }
    
    setTestingConnection(null);
  };

  return (
    <div className="grid gap-4">
      {/* Evolution API Card - Prominent Position */}
      <EvolutionApiCard />

      {/* Other Integrations */}
      {integrations.map((integration) => (
        <Card key={integration.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {integration.icon}
                <div>
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </div>
              </div>
              <Badge 
                variant={connectedApis[integration.id] ? "default" : "secondary"}
                className={connectedApis[integration.id] ? "bg-success" : ""}
              >
                {connectedApis[integration.id] ? (
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={integration.id}>{integration.keyName}</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id={integration.id}
                    type={showKeys[integration.id] ? "text" : "password"}
                    placeholder="Insira sua chave API..."
                    value={apiKeys[integration.id] || ''}
                    onChange={(e) => handleApiKeyChange(integration.id, e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(integration.id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKeys[integration.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => testConnection(integration.id)}
                  disabled={!apiKeys[integration.id] || testingConnection === integration.id}
                >
                  {testingConnection === integration.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Testar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
