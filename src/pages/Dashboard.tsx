import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { LeadsChart } from '@/components/dashboard/LeadsChart';
import { CampaignsList } from '@/components/dashboard/CampaignsList';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Users, UserCheck, TrendingUp, Coins } from 'lucide-react';
import { useLeadsCount, useQualifiedLeadsCount } from '@/hooks/useLeads';
import { useCompanyCredits } from '@/hooks/useCompany';

export default function Dashboard() {
  const { data: totalLeads = 0 } = useLeadsCount();
  const { data: qualifiedLeads = 0 } = useQualifiedLeadsCount();
  const { data: creditsRemaining = 0 } = useCompanyCredits();

  const conversionRate = totalLeads > 0
    ? ((qualifiedLeads / totalLeads) * 100).toFixed(1)
    : '0';

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Visão geral da sua prospecção"
    >
      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Quick Actions */}
      <QuickActions />
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Leads"
          value={totalLeads}
          change="+12% vs mês anterior"
          changeType="positive"
          icon={Users}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <MetricCard
          title="Leads Qualificados"
          value={qualifiedLeads}
          change="+8% vs mês anterior"
          changeType="positive"
          icon={UserCheck}
          iconColor="text-success"
          iconBg="bg-success/10"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          change="+2.3% vs mês anterior"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-warning"
          iconBg="bg-warning/10"
        />
        <MetricCard
          title="Créditos Restantes"
          value={creditsRemaining}
          change="de 500 disponíveis"
          changeType="neutral"
          icon={Coins}
          iconColor="text-accent"
          iconBg="bg-accent/10"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeadsChart />
          <CampaignsList />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </AppLayout>
  );
}
