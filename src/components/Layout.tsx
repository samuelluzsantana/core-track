import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Timer, Dumbbell, BarChart2, Settings } from 'lucide-react';
import Dock from './ui/Dock';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: <Home className="w-5 h-5" />, label: 'Home' },
    { path: '/plank', icon: <Timer className="w-5 h-5" />, label: 'Prancha' },
    { path: '/exercises', icon: <Dumbbell className="w-5 h-5" />, label: 'Exercícios' },
    { path: '/progress', icon: <BarChart2 className="w-5 h-5" />, label: 'Progresso' },
    { path: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Config.' },
  ];

  const dockItems = navItems.map((item) => {
    const isActive = location.pathname === item.path;
    return {
      icon: (
        <div className={`transition-colors ${isActive ? 'text-app-primary' : 'text-app-textMuted'}`}>
          {item.icon}
        </div>
      ),
      label: item.label,
      onClick: () => navigate(item.path),
      className: isActive ? 'dock-active' : '',
    };
  });

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex justify-center w-full">
      <div className="w-full max-w-[430px] h-screen flex flex-col relative bg-app-bg shadow-2xl overflow-hidden">
        {/* Ambient background orbs */}
        <div className="ambient-orb ambient-orb-amber w-64 h-64 -top-20 -right-20" />
        <div className="ambient-orb ambient-orb-teal w-48 h-48 bottom-32 -left-16" />

        <main className="flex-1 overflow-y-auto no-scrollbar pb-28">
          <Outlet />
        </main>

        {/* ReactBits Dock Navigation */}
        <div className="absolute bottom-0 left-0 right-0 z-50 pb-safe">
          <Dock
            items={dockItems}
            panelHeight={60}
            baseItemSize={40}
            magnification={56}
            distance={120}
            spring={{ mass: 0.1, stiffness: 170, damping: 14 }}
          />
        </div>
      </div>
    </div>
  );
}