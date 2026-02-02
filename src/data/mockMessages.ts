import { Message } from '@/types';
import { mockLeads } from './mockData';

const messageTemplates = {
  whatsapp: [
    'Olá! Somos especialistas em gestão para empresas de desentupimento. Podemos conversar?',
    'Oi! Vi que vocês têm ótimas avaliações. Gostaria de apresentar nossa solução de gestão.',
    'Bom dia! Temos uma ferramenta que pode ajudar a organizar os atendimentos de vocês.',
  ],
  email: [
    'Apresentação: Sistema de Gestão para Desentupidoras',
    'Aumente seus lucros com nossa plataforma',
    'Convite para demonstração gratuita',
  ],
  instagram: [
    'Ótimo trabalho! 👏 Vocês utilizam algum sistema de gestão?',
    'Parabéns pelo serviço! Temos uma solução que pode ajudar vocês.',
    'Excelente foto! Como vocês organizam os atendimentos?',
  ],
  facebook: [
    'Parabéns pela página! Vocês já conhecem nossa plataforma de gestão?',
    'Ótimo conteúdo! Gostaria de apresentar nossa solução.',
    'Excelente trabalho! Podemos ajudar a crescer ainda mais.',
  ],
};

const statuses: Message['status'][] = ['pending', 'scheduled', 'sent', 'delivered', 'failed', 'read'];
const channels: Message['channel'][] = ['whatsapp', 'email', 'instagram', 'facebook'];

function generateMockMessages(): Message[] {
  const messages: Message[] = [];
  
  for (let i = 0; i < 30; i++) {
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const lead = mockLeads[Math.floor(Math.random() * mockLeads.length)];
    const templates = messageTemplates[channel];
    const body = templates[Math.floor(Math.random() * templates.length)];
    
    // Weight status distribution
    const statusRandom = Math.random();
    let status: Message['status'];
    if (statusRandom < 0.15) status = 'pending';
    else if (statusRandom < 0.25) status = 'scheduled';
    else if (statusRandom < 0.4) status = 'sent';
    else if (statusRandom < 0.75) status = 'delivered';
    else if (statusRandom < 0.85) status = 'failed';
    else status = 'read';
    
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const scheduledAt = status === 'scheduled' 
      ? new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const sentAt = ['sent', 'delivered', 'read'].includes(status)
      ? new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000).toISOString()
      : null;
    
    messages.push({
      id: `msg-${i + 1}`,
      lead_id: lead.id,
      lead,
      channel,
      subject: channel === 'email' ? body : null,
      body: channel === 'email' 
        ? `Olá ${lead.business_name},\n\nGostaríamos de apresentar nossa solução completa de gestão...\n\nAtenciosamente,\nEquipe GestãoFlow`
        : body,
      status,
      scheduled_at: scheduledAt,
      sent_at: sentAt,
      created_at: createdAt.toISOString(),
      error_message: status === 'failed' ? 'Número não encontrado no WhatsApp' : null,
    });
  }
  
  return messages.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const mockMessages = generateMockMessages();

export const mockEngagementMetrics = {
  totalSent: mockMessages.filter(m => ['sent', 'delivered', 'read'].includes(m.status)).length,
  delivered: mockMessages.filter(m => m.status === 'delivered' || m.status === 'read').length,
  pending: mockMessages.filter(m => m.status === 'pending' || m.status === 'scheduled').length,
  failed: mockMessages.filter(m => m.status === 'failed').length,
  readRate: 45.2,
  responseRate: 12.8,
};
