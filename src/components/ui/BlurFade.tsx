/**
 * BlurFade — Magic UI (magicui.design)
 * Staggered blur-to-crisp reveal animation for cards, headers, and sections.
 */
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
}

export function BlurFade({
  children,
  className = '',
  delay = 0,
  duration = 0.38,
  yOffset = 8,
  blur = '6px',
}: BlurFadeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
