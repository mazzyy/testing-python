import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function Card({ 
  children, 
  className, 
  hover = false, 
  interactive = false,
  padding = 'md',
  onClick
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        interactive ? 'card-interactive' : hover ? 'card-hover' : 'card',
        paddings[padding],
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
