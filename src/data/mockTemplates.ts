import { MessageTemplate } from '@/types';

export const mockTemplates: MessageTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Primeiro Contato - WhatsApp',
    channel: 'whatsapp',
    subject: null,
    body: `Olá! Somos a GestãoFlow 👋

Notamos que a {business_name} tem excelentes avaliações em {city}!

Temos uma solução completa para gestão de empresas como a sua:
✅ Agendamento automatizado
✅ Controle financeiro
✅ CRM para clientes

Podemos conversar? 😊`,
    variables: ['business_name', 'city'],
    category: 'prospecting',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'tpl-2',
    name: 'Follow-up - WhatsApp',
    channel: 'whatsapp',
    subject: null,
    body: `Olá! Tudo bem? 😊

Entramos em contato há alguns dias sobre nossa solução de gestão para a {business_name}.

Você teve a oportunidade de avaliar? Estamos oferecendo uma demonstração gratuita de 15 minutos!

Posso agendar um horário? 📅`,
    variables: ['business_name'],
    category: 'follow_up',
    created_at: '2024-01-16T10:00:00Z',
  },
  {
    id: 'tpl-3',
    name: 'Apresentação Formal - Email',
    channel: 'email',
    subject: 'Proposta de Parceria - GestãoFlow para {business_name}',
    body: `Prezado(a),

Meu nome é [Seu Nome] e represento a GestãoFlow, uma plataforma completa de gestão empresarial.

Notamos que a {business_name} é referência em {city}, com excelentes avaliações dos clientes ({rating}⭐ com {total_reviews} avaliações).

Desenvolvemos uma solução especialmente para empresas do seu segmento, que inclui:

• Agendamento online integrado
• Controle financeiro completo
• CRM para gestão de clientes
• Relatórios e métricas em tempo real

Gostaríamos de apresentar nossa plataforma em uma demonstração gratuita de 15 minutos.

Qual seria o melhor horário para conversarmos?

Atenciosamente,
Equipe GestãoFlow`,
    variables: ['business_name', 'city', 'rating', 'total_reviews'],
    category: 'prospecting',
    created_at: '2024-01-17T10:00:00Z',
  },
  {
    id: 'tpl-4',
    name: 'Promoção Especial - Email',
    channel: 'email',
    subject: '🎁 Oferta Exclusiva para {business_name}',
    body: `Olá!

Temos uma oferta especial para a {business_name}!

Por tempo limitado, estamos oferecendo:
✅ 30 dias grátis de teste
✅ Implementação sem custo
✅ Suporte prioritário

Esta é uma oportunidade única de modernizar a gestão da sua empresa em {city}.

Clique aqui para agendar sua demonstração ou responda este email.

Um abraço,
Equipe GestãoFlow`,
    variables: ['business_name', 'city'],
    category: 'promotion',
    created_at: '2024-01-18T10:00:00Z',
  },
  {
    id: 'tpl-5',
    name: 'Engajamento - Instagram',
    channel: 'instagram',
    subject: null,
    body: `Parabéns pelo excelente trabalho! 👏🔧

Vi que a {business_name} está arrasando em {city}! 

Vocês utilizam algum sistema de gestão para organizar os atendimentos? Temos uma solução que pode ajudar muito! 💪

Me chama no direct! 📲`,
    variables: ['business_name', 'city'],
    category: 'social',
    created_at: '2024-01-19T10:00:00Z',
  },
  {
    id: 'tpl-6',
    name: 'Comentário - Facebook',
    channel: 'facebook',
    subject: null,
    body: `Que trabalho incrível! 🌟

A {business_name} é referência em qualidade. Parabéns!

Conhecem a GestãoFlow? Temos uma plataforma que pode ajudar a organizar ainda mais os atendimentos. 

Vou deixar o link nos comentários! 😊`,
    variables: ['business_name'],
    category: 'social',
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'tpl-7',
    name: 'Reativação - WhatsApp',
    channel: 'whatsapp',
    subject: null,
    body: `Olá! Como vai? 👋

Faz um tempo que conversamos sobre a GestãoFlow para a {business_name}.

Tivemos várias melhorias na plataforma desde então:
🆕 Novo app mobile
🆕 Integrações com WhatsApp
🆕 Relatórios avançados

Gostaria de conhecer as novidades? 

Temos condições especiais para clientes de {city}! 🎁`,
    variables: ['business_name', 'city'],
    category: 'reactivation',
    created_at: '2024-01-21T10:00:00Z',
  },
  {
    id: 'tpl-8',
    name: 'Agradecimento Pós-Demo - Email',
    channel: 'email',
    subject: 'Obrigado pela conversa, {business_name}! 🙏',
    body: `Olá!

Foi um prazer apresentar a GestãoFlow para a {business_name}!

Como combinamos, seguem os próximos passos:

1. Ativação do período de teste (30 dias grátis)
2. Agendamento da implementação
3. Treinamento da equipe

Qualquer dúvida, estou à disposição!

Atenciosamente,
Equipe GestãoFlow`,
    variables: ['business_name'],
    category: 'post_demo',
    created_at: '2024-01-22T10:00:00Z',
  },
];

export const templateCategories = [
  { id: 'prospecting', name: 'Prospecção', color: 'bg-blue-500' },
  { id: 'follow_up', name: 'Follow-up', color: 'bg-yellow-500' },
  { id: 'promotion', name: 'Promoção', color: 'bg-green-500' },
  { id: 'social', name: 'Redes Sociais', color: 'bg-pink-500' },
  { id: 'reactivation', name: 'Reativação', color: 'bg-orange-500' },
  { id: 'post_demo', name: 'Pós-Demo', color: 'bg-purple-500' },
];
