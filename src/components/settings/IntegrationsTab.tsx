import { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  Mail,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EvolutionApiCard } from './EvolutionApiCard';
import { useIntegrations, useUpsertIntegration, useTestIntegration } from '@/hooks/useIntegrations';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ApiIntegrationConfig {
  id: string;
  name: string;
  description: string;
  keyName: string;
  icon: React.ReactNode;
  hasExtraConfig?: boolean;
  isServerSecret?: boolean;
}

const integrationConfigs: ApiIntegrationConfig[] = [
  {
    id: 'google-places',
    name: 'Google Places API',
    description: 'Busca de leads em tempo real',
    keyName: 'GOOGLE_PLACES_API_KEY',
    icon: <div className="p-2 rounded-lg bg-blue-500/10"><span className="text-blue-500 text-lg">🗺️</span></div>,
    isServerSecret: true,
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
    icon: <div className="p-2 rounded-lg bg-teal-500/10"><Mail className="w-5 h-5 text-teal-500" /></div>,
    hasExtraConfig: true,
  },
];

export function IntegrationsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: integrations, isLoading } = useIntegrations();
  const upsertMutation = useUpsertIntegration();
  const testMutation = useTestIntegration();

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [resendSenderEmail, setResendSenderEmail] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Get company_id from profile
  useEffect(() => {
    async function fetchCompanyId() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (data?.company_id) setCompanyId(data.company_id);
    }
    fetchCompanyId();
  }, [user]);

  // Load saved integration data into form
  useEffect(() => {
    if (!integrations) return;
    const keys: Record<string, string> = {};
    let senderEmail = '';

    integrations.forEach((integration) => {
      const creds = integration.credentials as Record<string, string> | null;
      const config = integration.config as Record<string, string> | null;

      if (creds?.api_key) {
        keys[integration.provider] = creds.api_key;
      }
      if (integration.provider === 'resend' && config?.sender_email) {
        senderEmail = config.sender_email;
      }
    });

    setApiKeys(keys);
    if (senderEmail) setResendSenderEmail(senderEmail);
  }, [integrations]);

  // Check if an integration is connected (saved in DB)
  const connectedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    (integrations || []).forEach((i) => {
      if (i.is_active) map[i.provider] = true;
    });
    return map;
  }, [integrations]);

  const handleApiKeyChange = (integrationId: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [integrationId]: value }));
  };

  const toggleShowKey = (integrationId: string) => {
    setShowKeys(prev => ({ ...prev, [integrationId]: !prev[integrationId] }));
  };

  const handleSave = async (integrationId: string) => {
    if (!companyId) {
      toast({ title: 'Erro', description: 'Empresa não encontrada.', variant: 'destructive' });
      return;
    }

    const apiKey = apiKeys[integrationId];
    if (!apiKey) {
      toast({ title: 'Erro', description: 'Insira uma chave API.', variant: 'destructive' });
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        provider: integrationId,
        credentials: { api_key: apiKey },
        config: integrationId === 'resend' ? { sender_email: resendSenderEmail } : undefined,
        companyId,
      });

      toast({
        title: 'Salvo com sucesso!',
        description: 'A integração foi salva e estará disponível após recarregar.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (integrationId: string) => {
    const apiKey = apiKeys[integrationId];
    if (!apiKey) {
      toast({ title: 'Erro', description: 'Insira uma chave API primeiro.', variant: 'destructive' });
      return;
    }

    try {
      await testMutation.mutateAsync({ provider: integrationId, apiKey });
      toast({
        title: 'Formato válido!',
        description: 'O formato da chave parece correto. Salve para ativar.',
      });
    } catch (error: any) {
      toast({
        title: 'Falha na validação',
        description: error.message || 'Verifique a chave.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid gap-4">
      {/* Evolution API Card - Prominent Position */}
      <EvolutionApiCard />

      {/* Other Integrations */}
      {integrationConfigs.map((integration) => (
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
              {integration.isServerSecret ? (
                <Badge variant="default" className="bg-success gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Configurado (Server)
                </Badge>
              ) : (
                <Badge 
                  variant={connectedMap[integration.id] ? "default" : "secondary"}
                  className={connectedMap[integration.id] ? "bg-success" : ""}
                >
                  {connectedMap[integration.id] ? (
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
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {integration.isServerSecret ? (
              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <p className="text-sm text-success font-medium">
                  ✅ Esta API já está configurada como secret do servidor e é usada pela Edge Function de busca de leads.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Para alterar, entre em contato com o administrador do sistema.
                </p>
              </div>
            ) : (
              <>
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
                      onClick={() => handleTest(integration.id)}
                      disabled={!apiKeys[integration.id] || testMutation.isPending}
                    >
                      {testMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">Testar</span>
                    </Button>
                    <Button
                      onClick={() => handleSave(integration.id)}
                      disabled={!apiKeys[integration.id] || upsertMutation.isPending}
                    >
                      {upsertMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">Salvar</span>
                    </Button>
                  </div>
                </div>

                {/* Extra configuration for Resend */}
                {integration.id === 'resend' && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="resend-sender" className="text-sm">
                      Email Remetente
                    </Label>
                    <Input
                      id="resend-sender"
                      type="email"
                      placeholder="noreply@seudominio.com"
                      value={resendSenderEmail}
                      onChange={(e) => setResendSenderEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este email deve pertencer a um domínio verificado no Resend.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
