/**
 * ShimmerButton — Magic UI (magicui.design)
 * High-contrast CTA button with subtle sweeping light shimmer.
 */
import React, { ReactNode } from 'react';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function ShimmerButton({
  children,
  className = '',
  type = 'button',
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      type={type}
      className={`group relative overflow-hidden inline-flex items-center justify-center gap-2 font-bold transition-transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-sweep"
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
