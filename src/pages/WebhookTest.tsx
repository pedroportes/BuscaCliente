import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Globe,
  MapPin,
  Building2,
  Clock,
  Users
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

interface WebhookResponse {
  success?: boolean;
  campaign_id?: string;
  total_leads?: number;
  qualified_leads?: number;
  processing_time_ms?: number;
  steps_summary?: {
    google_maps_found?: number;
    websites_scraped?: number;
    emails_extracted?: number;
    whatsapp_detected?: number;
    instagram_found?: number;
  };
  error?: string;
}

export default function WebhookTest() {
  const { toast } = useToast();
  
  const [webhookUrl, setWebhookUrl] = useState('');
  const [campaignId, setCampaignId] = useState('test-campaign-001');
  const [companyId, setCompanyId] = useState('00000000-0000-0000-0000-000000000001');
  const [searchLocation, setSearchLocation] = useState('Curitiba, PR');
  const [searchNiches, setSearchNiches] = useState('desentupidora, encanador');
  const [radiusKm, setRadiusKm] = useState('20');
  
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [requestTime, setRequestTime] = useState<number | null>(null);

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: 'URL do Webhook necessária',
        description: 'Cole a URL do webhook do n8n para testar',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setRawResponse('');
    setError(null);
    setRequestTime(null);

    const startTime = Date.now();

    const payload = {
      campaign_id: campaignId,
      company_id: companyId,
      search_location: searchLocation,
      search_niches: searchNiches.split(',').map(n => n.trim()).filter(Boolean),
      radius_km: parseInt(radiusKm) || 20,
      started_at: new Date().toISOString(),
    };

    console.log('[WebhookTest] Disparando webhook:', { url: webhookUrl, payload });

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const elapsed = Date.now() - startTime;
      setRequestTime(elapsed);

      const text = await res.text();
      setRawResponse(text);

      console.log('[WebhookTest] Resposta:', { status: res.status, text });

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${res.statusText}`);
        toast({
          title: 'Erro na requisição',
          description: `O webhook retornou status ${res.status}`,
          variant: 'destructive',
        });
        return;
      }

      try {
        const data = JSON.parse(text);
        setResponse(data);
        
        if (data.success) {
          toast({
            title: 'Raspagem concluída!',
            description: `${data.total_leads || 0} leads encontrados em ${(elapsed / 1000).toFixed(1)}s`,
          });
        } else if (data.error) {
          setError(data.error);
        }
      } catch {
        // Response não é JSON válido
        console.log('[WebhookTest] Resposta não é JSON:', text);
      }
    } catch (err) {
      const elapsed = Date.now() - startTime;
      setRequestTime(elapsed);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      console.error('[WebhookTest] Erro:', err);
      
      toast({
        title: 'Erro ao chamar webhook',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout title="Teste de Webhook" subtitle="Teste a raspagem de leads via n8n">
      <div className="max-w-4xl space-y-6">

        {/* Alertas sobre problemas conhecidos */}
        <Card className="border-warning bg-warning/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Problemas Detectados no Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <span><strong>Coordenadas fixas:</strong> O locationBias está hardcoded para Curitiba - não usa a localização dinâmica</span>
            </div>
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <span><strong>Supabase Insert:</strong> Falta configurar o tableId: "leads" no nó de inserção</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <span><strong>Scrape response:</strong> O caminho websiteResponse.json.data pode estar incorreto</span>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuração do Webhook
            </CardTitle>
            <CardDescription>
              Cole a URL do webhook do n8n e configure os parâmetros de busca
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhookUrl">URL do Webhook *</Label>
              <Input
                id="webhookUrl"
                placeholder="https://seu-n8n.app.n8n.cloud/webhook/google-maps-scraper"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL do webhook do n8n (geralmente termina com /webhook/google-maps-scraper)
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaignId">Campaign ID</Label>
                <Input
                  id="campaignId"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyId">Company ID</Label>
                <Input
                  id="companyId"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="searchLocation" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Localização
                </Label>
                <Input
                  id="searchLocation"
                  placeholder="Curitiba, PR"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="radiusKm">Raio (km)</Label>
                <Input
                  id="radiusKm"
                  type="number"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchNiches" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Nichos (separados por vírgula)
              </Label>
              <Textarea
                id="searchNiches"
                placeholder="desentupidora, encanador, hidráulica"
                value={searchNiches}
                onChange={(e) => setSearchNiches(e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleTestWebhook} 
              disabled={isLoading || !webhookUrl}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando raspagem...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Disparar Webhook
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado */}
        {(response || error || rawResponse) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {response?.success ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : error ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  Resultado
                </span>
                {requestTime && (
                  <Badge variant="outline" className="font-normal">
                    <Clock className="h-3 w-3 mr-1" />
                    {(requestTime / 1000).toFixed(1)}s
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                  <strong>Erro:</strong> {error}
                </div>
              )}

              {response?.success && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{response.total_leads || 0}</div>
                    <div className="text-xs text-muted-foreground">Total Leads</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                    <div className="text-2xl font-bold">{response.qualified_leads || 0}</div>
                    <div className="text-xs text-muted-foreground">Qualificados</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Globe className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{response.steps_summary?.websites_scraped || 0}</div>
                    <div className="text-xs text-muted-foreground">Sites Acessados</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <Building2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{response.steps_summary?.emails_extracted || 0}</div>
                    <div className="text-xs text-muted-foreground">Emails Extraídos</div>
                  </div>
                </div>
              )}

              {response?.steps_summary && (
                <div className="space-y-2">
                  <h4 className="font-medium">Detalhes da Raspagem</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-muted-foreground">Google Maps</div>
                      <div className="font-medium">{response.steps_summary.google_maps_found || 0}</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-muted-foreground">Websites</div>
                      <div className="font-medium">{response.steps_summary.websites_scraped || 0}</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-muted-foreground">Emails</div>
                      <div className="font-medium">{response.steps_summary.emails_extracted || 0}</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-muted-foreground">WhatsApp</div>
                      <div className="font-medium">{response.steps_summary.whatsapp_detected || 0}</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-muted-foreground">Instagram</div>
                      <div className="font-medium">{response.steps_summary.instagram_found || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Resposta Raw</h4>
                <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                  {rawResponse || 'Nenhuma resposta'}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
