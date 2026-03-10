'use client';

import ModerationQueue from '@/modules/moderation/components/ModerationQueue';

export default function AdminModerationPage() {
  return (
    <div className="p-6 sm:p-8">
      <ModerationQueue />
    </div>
  );
}
