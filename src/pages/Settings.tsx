import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Key, User, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { IntegrationsTab } from '@/components/settings/IntegrationsTab';

export default function Settings() {
  const { toast } = useToast();

  const [profile, setProfile] = useState({
    name: 'João Silva',
    email: 'joao@empresa.com',
    company: 'Empresa ABC',
  });

  const [notifications, setNotifications] = useState({
    emailNewLeads: true,
    emailWeeklyReport: true,
    emailCampaignComplete: true,
    pushNewLeads: false,
    pushMessages: true,
    pushReminders: true,
  });

  const saveProfile = () => {
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  const saveNotifications = () => {
    toast({
      title: "Preferências salvas",
      description: "Suas preferências de notificação foram atualizadas.",
    });
  };

  return (
    <AppLayout title="Configurações" subtitle="Gerencie suas integrações e preferências">
      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="integrations" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1 md:gap-2 text-xs md:text-sm">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1 md:gap-2 text-xs md:text-sm">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
        </TabsList>

        {/* Integrações Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsTab />
        </TabsContent>

        {/* Perfil Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Alterar foto
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou GIF. Máximo 2MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Alterar senha</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha atual</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova senha</Label>
                    <Input id="new-password" type="password" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProfile}>Salvar alterações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificações por Email</CardTitle>
              <CardDescription>Configure quais emails você deseja receber</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novos leads encontrados</p>
                  <p className="text-sm text-muted-foreground">
                    Receba um email quando novos leads forem adicionados
                  </p>
                </div>
                <Switch
                  checked={notifications.emailNewLeads}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailNewLeads: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Relatório semanal</p>
                  <p className="text-sm text-muted-foreground">
                    Resumo semanal das suas campanhas e leads
                  </p>
                </div>
                <Switch
                  checked={notifications.emailWeeklyReport}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailWeeklyReport: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Campanha concluída</p>
                  <p className="text-sm text-muted-foreground">
                    Notificação quando uma campanha terminar de buscar
                  </p>
                </div>
                <Switch
                  checked={notifications.emailCampaignComplete}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailCampaignComplete: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações Push</CardTitle>
              <CardDescription>Configure notificações no navegador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novos leads</p>
                  <p className="text-sm text-muted-foreground">
                    Notificação instantânea de novos leads
                  </p>
                </div>
                <Switch
                  checked={notifications.pushNewLeads}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, pushNewLeads: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mensagens recebidas</p>
                  <p className="text-sm text-muted-foreground">
                    Quando um lead responder suas mensagens
                  </p>
                </div>
                <Switch
                  checked={notifications.pushMessages}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, pushMessages: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Lembretes</p>
                  <p className="text-sm text-muted-foreground">
                    Lembretes de follow-up agendados
                  </p>
                </div>
                <Switch
                  checked={notifications.pushReminders}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, pushReminders: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveNotifications}>Salvar preferências</Button>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
