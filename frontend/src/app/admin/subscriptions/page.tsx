"use client";

import { useQuery } from '@tanstack/react-query';
import { Crown, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../../services/api';

interface Subscription {
  id: string;
  status: string;
  adsRemaining: number;
  adsUsed: number;
  expiresAt: string;
  createdAt: string;
  user: { id: string; fullName: string; username: string };
  plan: { name: string; price: number; currency: string };
}

export default function AdminSubscriptionsPage() {
  const { data: subscriptions = [], isLoading } = useQuery<Subscription[]>({
    queryKey: ['adminSubscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/admin/subscriptions');
      return data.data;
    },
  });

  const { data: revenue } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/admin/revenue');
      return data.data;
    },
  });

  const statusColor = (s: string) => {
    if (s === 'ACTIVE') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (s === 'EXPIRED') return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  const statusIcon = (s: string) => {
    if (s === 'ACTIVE') return <CheckCircle className="w-4 h-4" />;
    if (s === 'EXPIRED') return <Clock className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-6 h-6 text-purple-600" />
        <h1 className="text-xl sm:text-2xl font-bold dark:text-white">Subscriptions</h1>
      </div>

      {/* Revenue Summary */}
      {revenue && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p className="text-xl font-bold dark:text-white">GH₵{revenue.totalRevenue?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
            <p className="text-xl font-bold dark:text-white">GH₵{revenue.monthlyRevenue?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Subscriptions</p>
            <p className="text-xl font-bold dark:text-white">{revenue.activeSubscriptions || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Payments</p>
            <p className="text-xl font-bold dark:text-white">{revenue.totalPayments || 0}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Crown className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No subscriptions yet</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Ads</th>
                  <th className="text-left p-3 font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Expires</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3">
                      <p className="font-medium dark:text-white">{sub.user.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{sub.user.username}</p>
                    </td>
                    <td className="p-3">
                      <span className="font-medium dark:text-white">{sub.plan.name}</span>
                      <p className="text-xs text-gray-500">GH₵{sub.plan.price}</p>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColor(sub.status)}`}>
                        {statusIcon(sub.status)}
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="dark:text-gray-300">
                        {sub.adsRemaining === -1 ? '∞' : sub.adsRemaining}/{sub.adsUsed + sub.adsRemaining}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 hidden md:table-cell text-xs">
                      {new Date(sub.expiresAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
