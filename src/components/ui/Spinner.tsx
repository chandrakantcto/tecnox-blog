import { clsx } from 'clsx';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className, label = 'Loading...' }: SpinnerProps) {
  return (
    <div role="status" className="flex items-center justify-center gap-2">
      <svg
        className={clsx('animate-spin text-violet-600', sizeClasses[size], className)}
        fill="none"
        viewBox="0 0 24 24"
        aria-label={label}
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingScreen({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <Spinner size="lg" />
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}
