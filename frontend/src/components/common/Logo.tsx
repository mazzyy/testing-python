import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

interface LogoMarkProps {
  className?: string;
  /** Unique suffix so multiple marks on one page don't share gradient ids */
  idSuffix?: string;
}

/**
 * CampusConsult mark — a compass needle inside a ring.
 * Guidance (consult) + direction (finding the right campus).
 * Pure SVG so it stays crisp from 16px favicon to hero size.
 */
export function LogoMark({ className, idSuffix = 'default' }: LogoMarkProps) {
  const gradId = `cc-grad-${idSuffix}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={clsx('shrink-0', className)}
      role="img"
      aria-label="CampusConsult"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#17a189" />
          <stop offset="100%" stopColor="#0b544c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
      <circle cx="32" cy="32" r="17.5" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="2.5" />
      <path d="M32 12.5 L41.5 32 L32 32 L22.5 32 Z" fill="#ffffff" />
      <path d="M32 51.5 L22.5 32 L32 32 L41.5 32 Z" fill="#ffffff" fillOpacity="0.5" />
      <circle cx="32" cy="32" r="2.6" fill="#0b544c" />
    </svg>
  );
}

interface LogoProps {
  /** Wrap in a router Link to the given path. Omit to render inline. */
  to?: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  idSuffix?: string;
}

export default function Logo({
  to,
  className,
  markClassName = 'w-9 h-9',
  wordmarkClassName = 'text-xl',
  showWordmark = true,
  idSuffix = 'default',
}: LogoProps) {
  const content = (
    <>
      <LogoMark className={markClassName} idSuffix={idSuffix} />
      {showWordmark && (
        <span className={clsx('font-display font-bold tracking-[-0.02em] leading-none', wordmarkClassName)}>
          <span className="text-surface-900 dark:text-white">Campus</span>
          <span className="text-primary-600 dark:text-primary-400">Consult</span>
        </span>
      )}
    </>
  );

  const classes = clsx('inline-flex items-center gap-2.5', className);

  if (to) {
    return (
      <Link to={to} className={classes} aria-label="CampusConsult home">
        {content}
      </Link>
    );
  }

  return <span className={classes}>{content}</span>;
}
