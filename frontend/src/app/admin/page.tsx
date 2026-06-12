'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  Building2,
  ShoppingBag,
  FileText,
  UsersRound,
  Home,
  Briefcase,
  CalendarDays,
  AlertTriangle,
  ShieldBan,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import api from '@/services/api';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  universities: number;
  marketplaceListings: number;
  notes: number;
  groups: number;
  hostels: number;
  jobs: number;
  events: number;
  pendingReports: number;
  bannedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalRevenue: number;
  recentActivity: any[];
  trends: Record<string, string>;
}

interface AnalyticsData {
  userGrowth: { month: string; users: number }[];
  contentDistribution: { name: string; value: number }[];
}

function KPICardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-gray-200 p-6 dark:bg-gray-800">
      <div className="mb-3 h-10 w-10 rounded-lg bg-gray-300 dark:bg-gray-700" />
      <div className="mb-2 h-4 w-24 rounded bg-gray-300 dark:bg-gray-700" />
      <div className="mb-2 h-8 w-16 rounded bg-gray-300 dark:bg-gray-700" />
      <div className="h-3 w-20 rounded bg-gray-300 dark:bg-gray-700" />
    </div>
  );
}

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

const kpiConfigs = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, gradient: 'from-indigo-500 to-indigo-700' },
  { key: 'activeUsers', label: 'Active Users', icon: UserCheck, gradient: 'from-emerald-500 to-emerald-700' },
  { key: 'universities', label: 'Universities', icon: Building2, gradient: 'from-blue-500 to-blue-700' },
  { key: 'marketplaceListings', label: 'Marketplace', icon: ShoppingBag, gradient: 'from-amber-500 to-amber-700' },
  { key: 'notes', label: 'Notes', icon: FileText, gradient: 'from-pink-500 to-pink-700' },
  { key: 'groups', label: 'Groups', icon: UsersRound, gradient: 'from-violet-500 to-violet-700' },
  { key: 'hostels', label: 'Hostels', icon: Home, gradient: 'from-cyan-500 to-cyan-700' },
  { key: 'jobs', label: 'Jobs', icon: Briefcase, gradient: 'from-orange-500 to-orange-700' },
  { key: 'events', label: 'Events', icon: CalendarDays, gradient: 'from-rose-500 to-rose-700' },
  { key: 'pendingReports', label: 'Pending Reports', icon: AlertTriangle, gradient: 'from-yellow-500 to-yellow-700' },
  { key: 'bannedUsers', label: 'Banned Users', icon: ShieldBan, gradient: 'from-red-500 to-red-700' },
] as const;

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data;
    },
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['adminAnalytics', timeRange],
    queryFn: async () => {
      const res = await api.get('/admin/analytics', { params: { range: timeRange } });
      return res.data;
    },
  });

  const getTrend = (key: string): { value: string; isPositive: boolean } => {
    if (!stats?.trends?.[key]) return { value: '0%', isPositive: true };
    const val = stats.trends[key];
    const numeric = parseFloat(val);
    return { value: val, isPositive: numeric >= 0 };
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Overview of your platform metrics and activity.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {statsLoading
            ? Array.from({ length: 11 }).map((_, i) => <KPICardSkeleton key={i} />)
            : kpiConfigs.map(({ key, label, icon: Icon, gradient }) => {
                const trend = getTrend(key);
                const value = stats?.[key as keyof DashboardStats] ?? 0;
                return (
                  <div
                    key={key}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br opacity-[0.07] group-hover:opacity-[0.12] transition-opacity ${gradient}`} />
                    <div className="relative p-6">
                      <div className={`mb-3 inline-flex rounded-lg bg-gradient-to-br p-2.5 text-white ${gradient}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                        {typeof value === 'number' ? value.toLocaleString() : String(value ?? 0)}
                      </p>
                      <div className="mt-2 flex items-center gap-1">
                        {trend.isPositive ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {trend.value}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">vs last period</span>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Charts */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* User Growth Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Growth</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Monthly new user registrations</p>
              </div>
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
            {analyticsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={analytics?.userGrowth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-30" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Content Distribution Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Content Distribution</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Breakdown of content types across the platform</p>
            </div>
            {analyticsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={analytics?.contentDistribution ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(analytics?.contentDistribution ?? []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb',
                        fontSize: '13px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                  {(analytics?.contentDistribution ?? []).map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
          </div>
          {statsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentActivity?.length ? (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.recentActivity.map((activity: any, index: number) => (
                <li key={index} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <img
                    src={activity.user?.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.user?.name ?? 'U')}&background=6366f1&color=fff`}
                    alt={activity.user?.name ?? 'User'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {activity.user?.name ?? 'Unknown User'}
                      </span>{' '}
                      {activity.action}
                    </p>
                    {activity.target && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500 truncate">
                        {activity.target}
                      </p>
                    )}
                  </div>
                  <time className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No recent activity to display.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
