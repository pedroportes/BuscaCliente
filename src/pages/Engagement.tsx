import { AppLayout } from '@/components/layout/AppLayout';
import { MessageComposer } from '@/components/engagement/MessageComposer';
import { MessageQueue } from '@/components/engagement/MessageQueue';
import { EngagementMetrics } from '@/components/engagement/EngagementMetrics';

export default function Engagement() {
  return (
    <AppLayout 
      title="Engajamento" 
      subtitle="Envie mensagens e gerencie interações com seus leads"
    >
      {/* Metrics */}
      <EngagementMetrics />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Message Composer */}
        <div className="lg:col-span-1">
          <MessageComposer />
        </div>

        {/* Message Queue */}
        <div className="lg:col-span-2">
          <MessageQueue />
        </div>
      </div>
    </AppLayout>
  );
}
