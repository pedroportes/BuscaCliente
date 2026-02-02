import { Card } from '@/components/ui/card';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useLeadsChartData } from '@/hooks/useLeads';
import { Loader2 } from 'lucide-react';

export function LeadsChart() {
  const { data: chartData, isLoading } = useLeadsChartData();

  return (
    <Card className="p-6 bg-card border-0 shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Leads nos últimos 30 dias</h3>
        <p className="text-sm text-muted-foreground">Evolução de leads capturados</p>
      </div>
      
      <div className="h-[280px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (chartData && chartData.length > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px hsl(222 47% 11% / 0.1)'
                }}
                labelStyle={{ color: 'hsl(222, 47%, 11%)' }}
              />
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke="hsl(217, 91%, 60%)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorLeads)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum dado disponível para o período
          </div>
        )}
      </div>
    </Card>
  );
}
