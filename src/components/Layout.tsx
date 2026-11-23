import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlayCircle, Layers, BarChart2, Settings } from 'lucide-react';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/train', altPath: '/plank', icon: PlayCircle, label: 'Treinar' },
    { path: '/exercises', icon: Layers, label: 'Biblioteca' },
    { path: '/progress', icon: BarChart2, label: 'Progresso' },
    { path: '/settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink flex justify-center w-full sm:py-4">
      <div className="w-full max-w-[460px] min-h-screen sm:min-h-[calc(100vh-2rem)] sm:max-h-[920px] flex flex-col relative bg-canvas sm:rounded-[28px] sm:border sm:border-border-token sm:shadow-elevated overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
          <Outlet />
        </main>

        {/* Ergonomic Bottom Navigation Bar */}
        <nav
          aria-label="Navegação principal"
          className="sticky bottom-0 left-0 right-0 z-40 border-t border-border-token backdrop-blur-xl pb-safe"
          style={{ backgroundColor: 'var(--bg-dock)' }}
        >
          <div className="grid grid-cols-5 px-2 py-2 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.altPath && location.pathname === item.altPath);

              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[50px] ${
                    isActive
                      ? 'text-modality-time bg-modality-time-soft/70'
                      : 'text-ink-muted hover:text-ink hover:bg-subtle/60'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-105 stroke-[2.3]' : 'stroke-[1.9]'
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-1 tracking-tight ${
                      isActive ? 'font-bold' : 'font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
