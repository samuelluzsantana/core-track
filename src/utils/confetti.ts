/**
 * Confetti celebrations — Magic UI (magicui.design) powered by canvas-confetti.
 */
import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#EA580C', '#0D9488', '#4F46E5', '#15803D', '#F59E0B'];

export function fireCelebrationConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    confetti({
      particleCount: 55,
      spread: 68,
      origin: { y: 0.72 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
  } catch {
    // ignore canvas failure in headless environments
  }
}

export function firePRConfetti() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.1, y: 0.7 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.9, y: 0.7 },
      colors: BRAND_COLORS,
      disableForReducedMotion: true,
    });
  } catch {
    // ignore canvas failure
  }
}
