/**
 * GlassIcons & GlassBadge — React Bits (reactbits.dev)
 * Tactile 3D layered frosted glass icons tuned for Light & Dark modes.
 */
import { ReactNode } from 'react';
import './GlassIcons.css';

const GRADIENT_MAP: Record<string, string> = {
  amber: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  orange: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  teal: 'linear-gradient(135deg, #2DD4BF 0%, #0D9488 100%)',
  indigo: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
  emerald: 'linear-gradient(135deg, #4ADE80 0%, #15803D 100%)',
  rose: 'linear-gradient(135deg, #FB7185 0%, #DC2626 100%)',
};

export type GlassTone = 'amber' | 'orange' | 'teal' | 'indigo' | 'emerald' | 'rose';

interface GlassBadgeProps {
  icon: ReactNode;
  tone?: GlassTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function GlassBadge({
  icon,
  tone = 'amber',
  size = 'md',
  className = '',
}: GlassBadgeProps) {
  const sizeClass =
    size === 'sm' ? 'rb-glass-sm' : size === 'lg' ? 'rb-glass-lg' : 'rb-glass-md';

  return (
    <span className={`rb-glass-badge group ${sizeClass} ${className}`} aria-hidden="true">
      <span
        className="rb-glass-back"
        style={{ background: GRADIENT_MAP[tone] || GRADIENT_MAP.amber }}
      />
      <span className="rb-glass-front">
        <span className="rb-glass-icon">{icon}</span>
      </span>
    </span>
  );
}
