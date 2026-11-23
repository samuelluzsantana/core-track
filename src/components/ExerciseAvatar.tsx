import React, { useEffect, useState } from 'react';
import {
  Timer,
  Dumbbell,
  Zap,
  Flame,
  Heart,
  Activity,
  Shield,
  Wind,
  Compass,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import { MeasurementType, ThemeColor } from '../types';

interface ExerciseAvatarProps {
  name: string;
  imageUrl?: string;
  measurementType?: MeasurementType;
  themeColor?: ThemeColor;
  iconName?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showZoomHint?: boolean;
}

const SIZE_MAP = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const ICON_SIZE = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
};

export function renderExerciseIcon(iconName: string, className: string) {
  switch (iconName) {
    case 'timer':
      return <Timer className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'wind':
      return <Wind className={className} />;
    case 'compass':
      return <Compass className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return <Dumbbell className={className} />;
  }
}

export function ExerciseAvatar({
  name,
  imageUrl,
  measurementType = 'reps_based',
  themeColor,
  iconName = 'dumbbell',
  size = 'md',
  onClick,
  showZoomHint = true,
}: ExerciseAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [imageUrl]);

  const colorClass =
    themeColor === 'indigo' || measurementType === 'interval_based'
      ? 'bg-modality-cardio-soft text-modality-cardio border-modality-cardio-border'
      : themeColor === 'emerald'
        ? 'bg-modality-mobility-soft text-modality-mobility border-modality-mobility-border'
        : themeColor === 'amber' || measurementType === 'time_based'
          ? 'bg-modality-time-soft text-modality-time border-modality-time-border'
          : 'bg-modality-reps-soft text-modality-reps border-modality-reps-border';

  const hasPhoto = Boolean(imageUrl && !imgError);

  const circleContent = hasPhoto ? (
    <div
      className={`${SIZE_MAP[size]} rounded-full overflow-hidden border border-border-token bg-white flex items-center justify-center ${
        onClick ? 'group-hover:border-modality-cardio transition-colors' : ''
      }`}
    >
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  ) : (
    <div
      className={`${SIZE_MAP[size]} rounded-full border flex items-center justify-center ${colorClass}`}
    >
      {renderExerciseIcon(iconName, ICON_SIZE[size])}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Visualizar foto e detalhes de ${name}`}
        title={`Visualizar ${name}`}
        className="relative group shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-modality-cardio cursor-pointer"
      >
        {circleContent}
        {showZoomHint && size !== 'sm' && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface border border-border-token shadow-sm flex items-center justify-center text-ink-secondary group-hover:text-modality-cardio transition-colors"
            aria-hidden="true"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </span>
        )}
      </button>
    );
  }

  return <div className="shrink-0">{circleContent}</div>;
}
