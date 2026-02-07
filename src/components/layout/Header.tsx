import { Bell, Search, Coins, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCompanyCredits } from '@/hooks/useCompany';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { data: credits, isLoading: creditsLoading } = useCompanyCredits();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const userEmail = user?.email || 'pedrosportes@gmail.com';
  const userName = user?.user_metadata?.full_name || 'Pedro Santos Portes';
  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao sair. Tente novamente.');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className={isMobile ? "ml-12" : ""}>
          <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - hidden on mobile */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads, campanhas..."
              className="w-64 pl-10 bg-muted/50 border-0 focus-visible:ring-primary"
            />
          </div>

          {/* Credits */}
          <div className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-primary/10 rounded-full">
            <Coins className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm font-semibold text-primary">
              {creditsLoading ? '...' : (credits ?? 0)}
            </span>
          </div>

          {/* Notifications - hidden on small mobile */}
          <Button variant="ghost" size="icon" className="relative hidden sm:flex">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              0
            </Badge>
          </Button>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-1 pr-1 md:pr-3 h-auto">
                <Avatar className="w-8 h-8 md:w-9 md:h-9 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs md:text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <User className="w-4 h-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
