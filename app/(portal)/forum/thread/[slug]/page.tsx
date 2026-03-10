'use client';

import { THREAD_STATUS } from '@/modules/forum/constants';
import ReactionBar from '@/modules/forum/components/ReactionBar';
import ReplyComposer from '@/modules/forum/components/ReplyComposer';
import ReportDialog from '@/modules/forum/components/ReportDialog';
import ThreadView from '@/modules/forum/components/ThreadView';
import { useForumThread } from '@/modules/forum/hooks/useForumThread';
import Header from '@/shared/components/Header';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const FORUM_NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/forum', label: 'Forum' },
  { href: '/feed', label: 'Announcements' },
  { href: '/news', label: 'Campus News' },
];

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const { user, loading: userLoading } = useCurrentUser();
  const { thread, replies, reactionCounts, loading, error, refreshReplies, refreshReactions } =
    useForumThread(params.slug);

  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [userLoading, router, user]);

  const handleReplyCreated = useCallback(() => {
    void refreshReplies();
  }, [refreshReplies]);

  const handleReacted = useCallback(() => {
    void refreshReactions();
  }, [refreshReactions]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} navLinks={FORUM_NAV} />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error ?? 'Thread not found.'}
          </div>
          <Link href="/forum" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
            ← Back to Forum
          </Link>
        </main>
      </div>
    );
  }

  const isLocked = thread.status === THREAD_STATUS.LOCKED;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} navLinks={FORUM_NAV} />
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/forum" className="hover:text-blue-600">
            Forum
          </Link>
          <span className="mx-1">/</span>
          <Link href={`/forum/${thread.category_id}`} className="hover:text-blue-600">
            Category
          </Link>
          <span className="mx-1">/</span>
          <span className="truncate text-gray-900">{thread.title}</span>
        </nav>

        <ThreadView thread={thread} replies={replies} reactionCounts={reactionCounts}>
          {/* Reaction bar + report button */}
          <div className="flex items-center gap-4">
            <ReactionBar threadId={thread.id} counts={reactionCounts} onReacted={handleReacted} />
            <button
              onClick={() => setReportOpen(true)}
              className="text-xs text-gray-400 transition hover:text-red-500"
            >
              Report
            </button>
          </div>

          {/* Reply composer */}
          <ReplyComposer
            threadId={thread.id}
            disabled={isLocked}
            onReplyCreated={handleReplyCreated}
          />
        </ThreadView>

        {reportOpen && <ReportDialog threadId={thread.id} onClose={() => setReportOpen(false)} />}
      </main>
    </div>
  );
}
