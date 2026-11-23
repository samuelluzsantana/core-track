/**
 * AnimatedCircularProgressBar — Magic UI (magicui.design)
 * Spring-animated circular gauge for readiness, goals, and metrics.
 */
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedCircularProgressBarProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor = 'var(--accent-time)',
  gaugeSecondaryColor = 'var(--ring-track)',
  size = 98,
  strokeWidth = 8,
  className = '',
  children,
}: AnimatedCircularProgressBarProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(max, Math.max(min, value));
  const percent = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
  const dashOffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`relative shrink-0 inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeSecondaryColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugePrimaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <span className="text-xl font-display font-extrabold text-ink tabular-nums">
            {Math.round(percent)}%
          </span>
        )}
      </div>
    </div>
  );
}
