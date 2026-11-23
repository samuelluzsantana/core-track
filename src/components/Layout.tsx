import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlayCircle, Layers, BarChart2, Settings } from 'lucide-react';
import { Dock, DockNavItem } from './ui/Dock';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: DockNavItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: <Home className="w-5 h-5" />,
      active: location.pathname === '/',
      onClick: () => navigate('/'),
    },
    {
      id: 'train',
      label: 'Treinar',
      icon: <PlayCircle className="w-5 h-5" />,
      active: location.pathname === '/train' || location.pathname === '/plank',
      onClick: () => navigate('/train'),
    },
    {
      id: 'exercises',
      label: 'Biblioteca',
      icon: <Layers className="w-5 h-5" />,
      active: location.pathname === '/exercises',
      onClick: () => navigate('/exercises'),
    },
    {
      id: 'progress',
      label: 'Progresso',
      icon: <BarChart2 className="w-5 h-5" />,
      active: location.pathname === '/progress',
      onClick: () => navigate('/progress'),
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: <Settings className="w-5 h-5" />,
      active: location.pathname === '/settings',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex justify-center w-full sm:py-4">
      <div className="w-full max-w-[460px] min-h-screen sm:min-h-[calc(100vh-2rem)] sm:max-h-[920px] flex flex-col relative bg-canvas sm:rounded-[28px] sm:border sm:border-border-token sm:shadow-elevated overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <Outlet />
        </main>

        {/* Ergonomic React Bits Magnification Dock */}
        <nav
          aria-label="Navegação principal"
          className="sticky bottom-0 left-0 right-0 z-40 border-t border-border-token backdrop-blur-xl pb-safe"
          style={{ backgroundColor: 'var(--bg-dock)' }}
        >
          <Dock items={navItems} />
        </nav>
      </div>
    </div>
  );
}
