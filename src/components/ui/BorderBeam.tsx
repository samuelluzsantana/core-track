/**
 * BorderBeam — Magic UI (magicui.design)
 * Animated beam of light traveling along the perimeter of a card.
 */
import { CSSProperties } from 'react';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  className?: string;
}

export function BorderBeam({
  size = 120,
  duration = 7,
  delay = 0,
  colorFrom = 'var(--accent-time)',
  colorTo = 'var(--accent-cardio)',
  borderWidth = 1.5,
  className = '',
}: BorderBeamProps) {
  const style = {
    '--beam-size': `${size}px`,
    '--beam-duration': `${duration}s`,
    '--beam-delay': `${delay}s`,
    '--beam-from': colorFrom,
    '--beam-to': colorTo,
    '--beam-border': `${borderWidth}px`,
  } as CSSProperties;

  return (
    <div
      style={style}
      aria-hidden="true"
      className={`border-beam-overlay ${className}`}
    />
  );
}
