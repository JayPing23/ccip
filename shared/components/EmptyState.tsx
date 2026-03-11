import { twMerge } from 'tailwind-merge';

type ContentType = 'announcement' | 'article' | 'forum' | 'generic';

interface EmptyStateProps {
  type?: ContentType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const defaults: Record<ContentType, { icon: string; title: string; description: string }> = {
  announcement: {
    icon: '📢',
    title: 'No announcements yet',
    description: 'Official announcements from your organizations will appear here.',
  },
  article: {
    icon: '📰',
    title: 'No articles yet',
    description: 'Campus news and features will appear here once published.',
  },
  forum: {
    icon: '💬',
    title: 'No threads in this category',
    description: 'Start a discussion to get the conversation going!',
  },
  generic: {
    icon: '📋',
    title: 'Nothing here yet',
    description: 'Check back later for new content.',
  },
};

export default function EmptyState({
  type = 'generic',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = defaults[type];

  return (
    <div
      className={twMerge(
        'bg-brand-surface border-brand-secondary/20 flex flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center',
        className
      )}
    >
      <span className="mb-4 text-4xl" aria-hidden="true">
        {config.icon}
      </span>
      <h3 className="text-brand-text-primary mb-1 text-lg font-semibold">
        {title ?? config.title}
      </h3>
      <p className="text-brand-text-muted mb-4 max-w-sm text-sm">
        {description ?? config.description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
