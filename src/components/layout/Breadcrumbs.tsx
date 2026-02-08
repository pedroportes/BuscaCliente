import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'leads': 'Leads',
    'campaigns': 'Campanhas',
    'engagement': 'Engajamento',
    'settings': 'Configurações',
    'reports': 'Relatórios',
    'new': 'Nova Campanha',
};

export function Breadcrumbs() {
    const location = useLocation();
    const pathSegments = location.pathname.split('/').filter(Boolean);

    // Don't show breadcrumbs on dashboard
    if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
        return null;
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Início', href: '/dashboard' },
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;

        // Check if it's a UUID (lead detail page)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

        if (isUUID) {
            breadcrumbs.push({
                label: 'Detalhes',
                href: index === pathSegments.length - 1 ? undefined : currentPath,
            });
        } else {
            breadcrumbs.push({
                label: routeLabels[segment] || segment,
                href: index === pathSegments.length - 1 ? undefined : currentPath,
            });
        }
    });

    return (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight className="w-4 h-4" />}
                    {crumb.href ? (
                        <Link
                            to={crumb.href}
                            className={cn(
                                "hover:text-foreground transition-colors",
                                index === 0 && "flex items-center gap-1"
                            )}
                        >
                            {index === 0 && <Home className="w-3.5 h-3.5" />}
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="text-foreground font-medium">{crumb.label}</span>
                    )}
                </div>
            ))}
        </nav>
    );
}
