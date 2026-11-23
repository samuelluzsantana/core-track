/**
 * DotPattern — Magic UI (magicui.design)
 * Subtle architectural SVG dot grid backdrop with radial edge fade.
 */
import { useId } from 'react';

interface DotPatternProps {
  width?: number;
  height?: number;
  cr?: number;
  className?: string;
}

export function DotPattern({
  width = 20,
  height = 20,
  cr = 1.1,
  className = '',
}: DotPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full fill-ink-muted/25 ${className}`}
      style={{
        maskImage:
          'radial-gradient(ellipse 85% 75% at 50% 25%, #000 35%, transparent 100%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 85% 75% at 50% 25%, #000 35%, transparent 100%)',
      }}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle cx={width / 2} cy={height / 2} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}
