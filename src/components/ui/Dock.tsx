/**
 * Dock — React Bits (reactbits.dev)
 * Interactive magnification navigation dock with shared-layout active indicator.
 * Balances smooth desktop pointer magnification with large mobile touch hitboxes.
 */
import { ReactNode, useRef } from 'react';
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

export interface DockNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}

interface DockProps {
  items: DockNavItem[];
  className?: string;
}

function DockIconButton({
  item,
  mouseX,
}: {
  item: DockNavItem;
  mouseX: MotionValue<number>;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || val === Infinity) return 150;
    return val - (rect.left + rect.width / 2);
  });

  const scaleTransform = useTransform(distance, [-95, 0, 95], [1, 1.18, 1]);
  const iconScale = useSpring(scaleTransform, {
    mass: 0.12,
    stiffness: 220,
    damping: 16,
  });

  const liftTransform = useTransform(distance, [-95, 0, 95], [0, -3, 0]);
  const iconLift = useSpring(liftTransform, {
    mass: 0.12,
    stiffness: 220,
    damping: 16,
  });

  return (
    <button
      ref={ref}
      type="button"
      onClick={item.onClick}
      aria-current={item.active ? 'page' : undefined}
      className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-colors min-h-[52px] focus:outline-none focus-visible:ring-2 focus-visible:ring-modality-time ${
        item.active
          ? 'text-modality-time'
          : 'text-ink-muted hover:text-ink'
      }`}
    >
      {item.active && (
        <motion.span
          layoutId="coretrack-dock-pill"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="absolute inset-0.5 rounded-xl bg-modality-time-soft border border-modality-time-border/80 shadow-sm"
          aria-hidden="true"
        />
      )}

      <motion.span
        style={{ scale: iconScale, y: iconLift }}
        className="relative z-10 flex items-center justify-center"
      >
        {item.icon}
      </motion.span>
      <span
        className={`relative z-10 text-[10px] mt-1 tracking-tight ${
          item.active ? 'font-bold' : 'font-medium'
        }`}
      >
        {item.label}
      </span>
    </button>
  );
}

export function Dock({ items, className = '' }: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`grid grid-cols-5 px-2 py-1.5 gap-1 ${className}`}
    >
      {items.map((item) => (
        <DockIconButton key={item.id} item={item} mouseX={mouseX} />
      ))}
    </div>
  );
}
