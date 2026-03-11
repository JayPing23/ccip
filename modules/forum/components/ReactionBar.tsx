'use client';

import { REACTION_TYPE, REACTION_TYPE_LABELS } from '@/modules/forum/constants';
import type { ReactionType } from '@/modules/forum/constants';
import { useToggleReaction } from '@/modules/forum/hooks/useForumThread';
import { useCallback } from 'react';

interface ReactionBarProps {
  threadId: string;
  replyId?: string | null;
  counts: Record<string, number>;
  onReacted?: () => void;
}

const REACTION_EMOJI: Record<ReactionType, string> = {
  LIKE: '👍',
  HELPFUL: '💡',
  INSIGHTFUL: '🔍',
};

export default function ReactionBar({ threadId, replyId, counts, onReacted }: ReactionBarProps) {
  const { toggleReaction, loading } = useToggleReaction();

  const handleClick = useCallback(
    async (type: ReactionType) => {
      const ok = await toggleReaction(threadId, type, replyId);
      if (ok) onReacted?.();
    },
    [threadId, replyId, toggleReaction, onReacted]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {Object.values(REACTION_TYPE).map((type) => {
        const count = counts[type] ?? 0;
        return (
          <button
            key={type}
            onClick={() => handleClick(type)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-full border border-brand-secondary/20 px-3 py-1 text-xs font-medium text-brand-text-secondary transition hover:border-brand-secondary hover:bg-brand-accent/10 disabled:opacity-50"
          >
            <span>{REACTION_EMOJI[type]}</span>
            <span>{REACTION_TYPE_LABELS[type]}</span>
            {count > 0 && <span className="ml-0.5 text-brand-text-muted">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
