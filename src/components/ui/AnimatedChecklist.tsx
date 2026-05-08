/**
 * AnimatedChecklist — Vendored from Uiverse.io by JkHuger
 * Animated checkbox with firework effect and strikethrough.
 * Adapted to React + TypeScript with custom theming.
 */
import { ReactNode } from 'react';
import './AnimatedChecklist.css';

export interface ChecklistItem {
  id: string;
  label: string | ReactNode;
  checked: boolean;
}

interface AnimatedChecklistProps {
  items: ChecklistItem[];
  onToggle?: (id: string, checked: boolean) => void;
  className?: string;
}

export function AnimatedChecklist({
  items,
  onToggle,
  className = '',
}: AnimatedChecklistProps) {
  return (
    <div className={`checklist-container ${className}`}>
      {items.map((item) => (
        <div key={item.id} className="checklist-row">
          <input
            checked={item.checked}
            type="checkbox"
            id={`chk-${item.id}`}
            className="checklist-input"
            onChange={(e) => onToggle?.(item.id, e.target.checked)}
          />
          <label htmlFor={`chk-${item.id}`} className="checklist-label">
            {item.label}
          </label>
        </div>
      ))}
    </div>
  );
}
