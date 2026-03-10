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
        <p className="text-gray-500">Loading retention data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Content Lifecycle & Retention</h2>
        <p className="mt-1 text-gray-600">
          Manage retention policies and review stale content across all pillars.
        </p>
      </div>

      {/* Retention Policies */}
      <section className="mb-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Retention Policies</h3>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Content Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Stale After (days)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Auto-Archive After (days)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Enabled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.policies.map((policy) => (
                <tr key={policy.id}>
                  {editingPolicy === policy.id ? (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
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
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
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
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
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
                          className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPolicy(null)}
                          className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {policy.content_type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{policy.stale_after_days}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {policy.auto_archive_after_days ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            policy.enabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {policy.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => startEditing(policy)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Stale Content Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-2xl font-bold text-yellow-700">{data?.candidates.totalStale ?? 0}</p>
            <p className="text-sm text-yellow-600">Flagged as stale</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-2xl font-bold text-red-700">
              {data?.candidates.totalArchivable ?? 0}
            </p>
            <p className="text-sm text-red-600">Ready for auto-archive</p>
          </div>
        </div>
      </section>

      {/* Candidate List */}
      {data && data.candidates.candidates.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Retention Candidates</h3>
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
                    className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Archive {count} {ct.toLowerCase()}s
                  </button>
                );
              })}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Age (days)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.candidates.candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-900">
                      {candidate.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{candidate.content_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{candidate.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{candidate.age_days}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          candidate.recommended_action === 'ARCHIVE'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
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
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-green-700">
            No stale content detected. All content is within retention thresholds.
          </p>
        </div>
      )}
    </div>
  );
}
