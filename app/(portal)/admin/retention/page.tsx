'use client';

import { useCallback, useEffect, useState } from 'react';

interface RetentionPolicy {
  id: string;
  content_type: 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD';
  stale_after_days: number;
  auto_archive_after_days: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface RetentionCandidate {
  id: string;
  content_type: 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD';
  title: string;
  status: string;
  last_activity_at: string;
  age_days: number;
  recommended_action: 'ARCHIVE' | 'FLAG_STALE' | 'NONE';
}

interface RetentionData {
  policies: RetentionPolicy[];
  candidates: {
    totalStale: number;
    totalArchivable: number;
    candidates: RetentionCandidate[];
  };
}

export default function AdminRetentionPage() {
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState<{
    stale_after_days: number;
    auto_archive_after_days: number | null;
    enabled: boolean;
  }>({ stale_after_days: 90, auto_archive_after_days: null, enabled: true });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/retention');
      if (!res.ok) throw new Error('Failed to load retention data');
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const startEditing = (policy: RetentionPolicy) => {
    setEditingPolicy(policy.id);
    setPolicyForm({
      stale_after_days: policy.stale_after_days,
      auto_archive_after_days: policy.auto_archive_after_days,
      enabled: policy.enabled,
    });
  };

  const savePolicy = async () => {
    if (!editingPolicy) return;
    try {
      const res = await fetch('/api/admin/retention', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPolicy, ...policyForm }),
      });
      if (!res.ok) throw new Error('Failed to update policy');
      setEditingPolicy(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update policy');
    }
  };

  const archiveCandidates = async (contentType: 'ANNOUNCEMENT' | 'ARTICLE' | 'THREAD') => {
    if (!data) return;
    const ids = data.candidates.candidates
      .filter((c) => c.content_type === contentType && c.recommended_action === 'ARCHIVE')
      .map((c) => c.id);

    if (ids.length === 0) return;

    try {
      setArchiving(true);
      const res = await fetch('/api/admin/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type: contentType, ids }),
      });
      if (!res.ok) throw new Error('Failed to archive content');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive content');
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-brand-text-muted">Loading retention data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <div className="bg-status-error/10 text-status-error rounded-lg p-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h2 className="text-brand-text-primary text-2xl font-bold">
          Content Lifecycle & Retention
        </h2>
        <p className="text-brand-text-secondary mt-1">
          Manage retention policies and review stale content across all pillars.
        </p>
      </div>

      {/* Retention Policies */}
      <section className="mb-8">
        <h3 className="text-brand-text-primary mb-4 text-lg font-semibold">Retention Policies</h3>
        <div className="border-brand-secondary/20 bg-brand-surface overflow-hidden rounded-lg border shadow-sm">
          <table className="divide-brand-secondary/20 min-w-full divide-y">
            <thead className="bg-brand-bg">
              <tr>
                <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                  Content Type
                </th>
                <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                  Stale After (days)
                </th>
                <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                  Auto-Archive After (days)
                </th>
                <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                  Enabled
                </th>
                <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-brand-secondary/20 divide-y">
              {data?.policies.map((policy) => (
                <tr key={policy.id}>
                  {editingPolicy === policy.id ? (
                    <>
                      <td className="text-brand-text-primary px-4 py-3 text-sm font-medium">
                        {policy.content_type}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          title="Stale after days"
                          value={policyForm.stale_after_days}
                          onChange={(e) =>
                            setPolicyForm((f) => ({
                              ...f,
                              stale_after_days: parseInt(e.target.value) || 1,
                            }))
                          }
                          className="border-brand-secondary/30 w-20 rounded border px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          value={policyForm.auto_archive_after_days ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPolicyForm((f) => ({
                              ...f,
                              auto_archive_after_days: val === '' ? null : parseInt(val) || null,
                            }));
                          }}
                          placeholder="None"
                          className="border-brand-secondary/30 w-20 rounded border px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          title="Policy enabled"
                          checked={policyForm.enabled}
                          onChange={(e) =>
                            setPolicyForm((f) => ({ ...f, enabled: e.target.checked }))
                          }
                        />
                      </td>
                      <td className="flex gap-2 px-4 py-3">
                        <button
                          onClick={savePolicy}
                          className="bg-brand-primary hover:bg-brand-primary/80 rounded px-3 py-1 text-xs font-medium text-white"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPolicy(null)}
                          className="border-brand-secondary/30 text-brand-text-secondary hover:bg-brand-bg rounded border px-3 py-1 text-xs font-medium"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="text-brand-text-primary px-4 py-3 text-sm font-medium">
                        {policy.content_type}
                      </td>
                      <td className="text-brand-text-secondary px-4 py-3 text-sm">
                        {policy.stale_after_days}
                      </td>
                      <td className="text-brand-text-secondary px-4 py-3 text-sm">
                        {policy.auto_archive_after_days ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            policy.enabled
                              ? 'bg-status-success/15 text-status-success'
                              : 'bg-brand-secondary/10 text-brand-text-muted'
                          }`}
                        >
                          {policy.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => startEditing(policy)}
                          className="text-brand-primary hover:text-brand-primary text-sm font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stale Content Summary */}
      <section className="mb-8">
        <h3 className="text-brand-text-primary mb-4 text-lg font-semibold">
          Stale Content Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border-status-warning/20 bg-status-warning/10 rounded-lg border p-4">
            <p className="text-status-warning text-2xl font-bold">
              {data?.candidates.totalStale ?? 0}
            </p>
            <p className="text-status-warning text-sm">Flagged as stale</p>
          </div>
          <div className="border-status-error/20 bg-status-error/10 rounded-lg border p-4">
            <p className="text-status-error text-2xl font-bold">
              {data?.candidates.totalArchivable ?? 0}
            </p>
            <p className="text-status-error text-sm">Ready for auto-archive</p>
          </div>
        </div>
      </section>

      {/* Candidate List */}
      {data && data.candidates.candidates.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-brand-text-primary text-lg font-semibold">Retention Candidates</h3>
            <div className="flex gap-2">
              {(['ANNOUNCEMENT', 'ARTICLE', 'THREAD'] as const).map((ct) => {
                const count = data.candidates.candidates.filter(
                  (c) => c.content_type === ct && c.recommended_action === 'ARCHIVE'
                ).length;
                if (count === 0) return null;
                return (
                  <button
                    key={ct}
                    onClick={() => archiveCandidates(ct)}
                    disabled={archiving}
                    className="bg-status-error hover:bg-status-error/80 rounded px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                  >
                    Archive {count} {ct.toLowerCase()}s
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-brand-secondary/20 bg-brand-surface overflow-hidden rounded-lg border shadow-sm">
            <table className="divide-brand-secondary/20 min-w-full divide-y">
              <thead className="bg-brand-bg">
                <tr>
                  <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                    Title
                  </th>
                  <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                    Type
                  </th>
                  <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                    Status
                  </th>
                  <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                    Age (days)
                  </th>
                  <th className="text-brand-text-muted px-4 py-3 text-left text-xs font-medium uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-brand-secondary/20 divide-y">
                {data.candidates.candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td className="text-brand-text-primary max-w-50 truncate px-4 py-3 text-sm">
                      {candidate.title}
                    </td>
                    <td className="text-brand-text-secondary px-4 py-3 text-sm">
                      {candidate.content_type}
                    </td>
                    <td className="text-brand-text-secondary px-4 py-3 text-sm">
                      {candidate.status}
                    </td>
                    <td className="text-brand-text-secondary px-4 py-3 text-sm">
                      {candidate.age_days}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          candidate.recommended_action === 'ARCHIVE'
                            ? 'bg-status-error/15 text-status-error'
                            : 'bg-status-warning/15 text-status-warning'
                        }`}
                      >
                        {candidate.recommended_action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {data && data.candidates.candidates.length === 0 && (
        <div className="border-status-success/20 bg-status-success/10 rounded-lg border p-6 text-center">
          <p className="text-status-success">
            No stale content detected. All content is within retention thresholds.
          </p>
        </div>
      )}
    </div>
  );
}
