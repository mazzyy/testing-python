import { clsx } from 'clsx';

interface MatchScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function MatchScore({ score, size = 'md', showLabel = true }: MatchScoreProps) {
  const sizes = {
    sm: { container: 'w-10 h-10', text: 'text-xs', stroke: 3 },
    md: { container: 'w-14 h-14', text: 'text-sm', stroke: 4 },
    lg: { container: 'w-20 h-20', text: 'text-lg', stroke: 5 },
  };

  const getColor = (score: number) => {
    if (score >= 80) return { stroke: '#10b981', bg: '#ecfdf5' }; // green
    if (score >= 60) return { stroke: '#3b82f6', bg: '#eff6ff' }; // blue
    if (score >= 40) return { stroke: '#f59e0b', bg: '#fffbeb' }; // amber
    return { stroke: '#ef4444', bg: '#fef2f2' }; // red
  };

  const { container, text, stroke } = sizes[size];
  const color = getColor(score);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={clsx('relative score-ring', container)}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill={color.bg}
            stroke="#e5e7eb"
            strokeWidth={stroke}
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color.stroke}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx('font-bold', text)} style={{ color: color.stroke }}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-surface-500 dark:text-surface-400 font-medium">Match</span>
      )}
    </div>
  );
}
