import { twMerge } from 'tailwind-merge';

type BadgeVariant = 'draft' | 'in-review' | 'published' | 'archived' | 'flagged';

interface StatusBadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const badgeStyles: Record<BadgeVariant, string> = {
  draft: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  'in-review': 'bg-brand-accent/20 text-brand-primary border-brand-accent/40',
  published: 'bg-status-success/15 text-status-success border-status-success/30',
  archived: 'bg-brand-text-muted/15 text-brand-text-muted border-brand-text-muted/30',
  flagged: 'bg-status-error/15 text-status-error border-status-error/30',
};

const labelMap: Record<BadgeVariant, string> = {
  draft: 'Draft',
  'in-review': 'In Review',
  published: 'Published',
  archived: 'Archived',
  flagged: 'Flagged',
};

export default function StatusBadge({ variant, className }: StatusBadgeProps) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeStyles[variant],
        className
      )}
    >
      {labelMap[variant]}
    </span>
  );
}
