'use client';

import {
  useNotificationPreferences,
  useUpsertPreference,
} from '@/modules/notifications/hooks/useNotifications';
import type { NotificationPreferenceInput } from '@/modules/notifications/types';
import { DIGEST_OPTIONS } from '@/modules/notifications/types';
import type { INotificationPreference, IOrganization } from '@/shared/types/database.types';
import { useCallback, useState } from 'react';

interface NotificationPreferencesProps {
  organizations: IOrganization[];
  orgsLoading: boolean;
}

const DIGEST_LABELS: Record<INotificationPreference['email_digest'], string> = {
  IMMEDIATE: 'Immediate',
  DAILY: 'Daily digest',
  WEEKLY: 'Weekly digest',
  NONE: 'None',
};

interface OrgPrefRowProps {
  org: IOrganization;
  preference: INotificationPreference | undefined;
  onSave: (input: NotificationPreferenceInput) => Promise<void>;
  saving: boolean;
}

function OrgPrefRow({ org, preference, onSave, saving }: OrgPrefRowProps) {
  const [inApp, setInApp] = useState(preference?.in_app_enabled ?? true);
  const [email, setEmail] = useState(preference?.email_enabled ?? true);
  const [digest, setDigest] = useState<INotificationPreference['email_digest']>(
    preference?.email_digest ?? 'DAILY'
  );
  const [dirty, setDirty] = useState(false);
  const [lastPrefKey, setLastPrefKey] = useState<string | undefined>(undefined);

  // Derive a stable identity for the preference row so we can detect external changes
  const prefKey = preference
    ? `${preference.in_app_enabled}-${preference.email_enabled}-${preference.email_digest}-${preference.updated_at}`
    : undefined;

  if (prefKey !== lastPrefKey) {
    setLastPrefKey(prefKey);
    if (preference) {
      setInApp(preference.in_app_enabled);
      setEmail(preference.email_enabled);
      setDigest(preference.email_digest);
      setDirty(false);
    }
  }

  const handleChange = useCallback((setter: (v: never) => void, value: unknown) => {
    (setter as (v: unknown) => void)(value);
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    await onSave({
      orgId: org.id,
      inAppEnabled: inApp,
      emailEnabled: email,
      emailDigest: digest,
    });
    setDirty(false);
  }, [onSave, org.id, inApp, email, digest]);

  return (
    <div className="border-brand-secondary/20 bg-brand-surface flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-brand-text-primary truncate font-medium">{org.name}</p>
        <p className="text-brand-text-muted text-xs capitalize">{org.type.toLowerCase()}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-brand-text-secondary flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inApp}
            onChange={(e) => handleChange(setInApp as never, e.target.checked)}
            className="border-brand-secondary/30 text-brand-primary focus:ring-brand-primary h-4 w-4 rounded"
          />
          In-app
        </label>

        <label className="text-brand-text-secondary flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={email}
            onChange={(e) => handleChange(setEmail as never, e.target.checked)}
            className="border-brand-secondary/30 text-brand-primary focus:ring-brand-primary h-4 w-4 rounded"
          />
          Email
        </label>

        <label className="text-brand-text-secondary flex items-center gap-2 text-sm">
          <span className="sr-only">Email digest frequency for {org.name}</span>
          <select
            value={digest}
            disabled={!email}
            onChange={(e) =>
              handleChange(
                setDigest as never,
                e.target.value as INotificationPreference['email_digest']
              )
            }
            className="border-brand-secondary/30 bg-brand-surface text-brand-text-secondary focus:border-brand-primary focus:ring-brand-primary rounded-md border px-2 py-1 text-sm disabled:opacity-50"
          >
            {DIGEST_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {DIGEST_LABELS[opt]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="bg-brand-primary hover:bg-brand-primary/80 rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function NotificationPreferences({
  organizations,
  orgsLoading,
}: NotificationPreferencesProps) {
  const {
    preferences,
    loading: prefsLoading,
    error: prefsError,
    refresh,
  } = useNotificationPreferences();

  const {
    upsert,
    saving,
    error: saveError,
  } = useUpsertPreference(() => {
    void refresh();
  });

  const prefByOrg = new Map(preferences.map((p) => [p.org_id, p]));

  if (orgsLoading || prefsLoading) {
    return (
      <div className="text-brand-text-muted py-6 text-center text-sm">Loading preferences…</div>
    );
  }

  if (prefsError) {
    return (
      <div className="bg-status-error/10 text-status-error rounded-lg p-4 text-sm">
        {prefsError}
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <p className="text-brand-text-muted py-6 text-center text-sm">No organizations available.</p>
    );
  }

  return (
    <div className="space-y-3">
      {saveError && (
        <div className="bg-status-error/10 text-status-error rounded-lg p-3 text-sm">
          {saveError}
        </div>
      )}
      {organizations.map((org) => (
        <OrgPrefRow
          key={org.id}
          org={org}
          preference={prefByOrg.get(org.id)}
          onSave={upsert}
          saving={saving}
        />
      ))}
    </div>
  );
}
