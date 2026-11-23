/**
 * BlurText — React Bits (reactbits.dev)
 * Animated word-by-word blur reveal for headlines and greetings.
 */
import { motion } from 'framer-motion';

interface BlurTextProps {
  text: string;
  className?: string;
  delayStep?: number;
}

export function BlurText({
  text,
  className = '',
  delayStep = 0.045,
}: BlurTextProps) {
  const words = text.split(' ');

  return (
    <span className={`inline-flex flex-wrap gap-x-[0.28em] ${className}`}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.4,
            delay: index * delayStep,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
