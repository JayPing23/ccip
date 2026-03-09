'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  publishedContent: number;
  totalOrganizations: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatCard({ label, value, icon, color = 'blue' }: StatCardProps) {
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 text-xl ${bgMap[color ?? 'blue']}`}>{icon}</div>
      </div>
    </div>
  );
}

/**
 * StatsGrid — fetches real counts from /api/admin/stats
 */
export function StatsGrid() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data ?? null))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const display = (v: number | undefined) => (loading ? '...' : String(v ?? '-'));

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Total Users" value={display(stats?.totalUsers)} icon="👥" color="blue" />
      <StatCard
        label="Published Content"
        value={display(stats?.publishedContent)}
        icon="📰"
        color="green"
      />
      <StatCard
        label="Organizations"
        value={display(stats?.totalOrganizations)}
        icon="🏢"
        color="purple"
      />
    </div>
  );
}

/**
 * ActivityFeed — audit log placeholder (full feed planned for Phase 2)
 */
export function ActivityFeed() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-gray-900">Recent Activity</h3>
      <p className="text-sm text-gray-500">
        Full audit log feed will be available in Phase 2.
      </p>
    </div>
  );
}
