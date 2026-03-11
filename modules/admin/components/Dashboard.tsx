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
    blue: 'bg-brand-accent/15 text-brand-primary',
    green: 'bg-status-success/15 text-status-success',
    purple: 'bg-brand-secondary/15 text-brand-primary',
    orange: 'bg-status-warning/15 text-status-warning',
  };
  return (
    <div className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-brand-text-secondary text-sm font-medium">{label}</p>
          <p className="text-brand-text-primary mt-2 text-3xl font-bold">{value}</p>
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
    <div className="bg-brand-surface border-brand-secondary/20 rounded-lg border p-6 shadow-sm">
      <h3 className="text-brand-text-primary mb-4 text-lg font-bold">Recent Activity</h3>
      <p className="text-brand-text-muted text-sm">
        Full audit log feed will be available in Phase 2.
      </p>
    </div>
  );
}
