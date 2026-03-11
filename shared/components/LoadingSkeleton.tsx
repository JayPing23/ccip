import { twMerge } from 'tailwind-merge';

interface LoadingSkeletonProps {
  variant?: 'card' | 'line' | 'circle' | 'badge';
  count?: number;
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={twMerge('bg-brand-secondary/20 animate-pulse rounded', className)} />;
}

function CardSkeleton() {
  return (
    <div className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-6 w-3/4 rounded" />
          <div className="flex gap-2">
            <SkeletonPulse className="h-5 w-20 rounded-full" />
            <SkeletonPulse className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mb-4 space-y-2">
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-full" />
        <SkeletonPulse className="h-4 w-2/3" />
      </div>
      <div className="border-brand-secondary/10 border-t pt-3">
        <SkeletonPulse className="h-3 w-40" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({
  variant = 'card',
  count = 3,
  className,
}: LoadingSkeletonProps) {
  if (variant === 'line') {
    return (
      <div className={twMerge('space-y-3', className)}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonPulse key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={twMerge('flex gap-3', className)}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonPulse key={i} className="h-10 w-10 rounded-full" />
        ))}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={twMerge('flex gap-2', className)}>
        {Array.from({ length: count }, (_, i) => (
          <SkeletonPulse key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={twMerge('space-y-4', className)}>
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
