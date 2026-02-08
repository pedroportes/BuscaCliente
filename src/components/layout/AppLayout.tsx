import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={isMobile ? "pl-0" : "pl-64"}>
        <Header title={title} subtitle={subtitle} />
        <main className="p-4 md:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}

