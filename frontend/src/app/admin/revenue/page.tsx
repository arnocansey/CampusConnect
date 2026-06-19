"use client";

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Star, TrendingUp, DollarSign, ShoppingCart, Users, Building, BarChart3 } from 'lucide-react';

export default function AdminRevenuePage() {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: async () => {
      const { data } = await api.get('/revenue/admin/revenue');
      return data.data;
    },
  });

  const { data: premiumSellers = [] } = useQuery({
    queryKey: ['adminPremiumSellers'],
    queryFn: async () => {
      const { data } = await api.get('/revenue/admin/premium-sellers');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const breakdown = revenue?.breakdown || {};

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Revenue Dashboard</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">GH₵{revenue?.totalRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">GH₵{revenue?.monthlyRevenue?.toFixed(2) || '0.00'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 30 Days</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{premiumSellers.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Premium Sellers</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{revenue?.platformFeePercent || 10}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Platform Fee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Revenue Breakdown</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {Object.entries(breakdown).map(([key, data]: [string, any]) => (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              {key === 'notes' && <ShoppingCart className="w-5 h-5 text-blue-500" />}
              {key === 'tickets' && <Users className="w-5 h-5 text-green-500" />}
              {key === 'hostels' && <Building className="w-5 h-5 text-purple-500" />}
              <h3 className="font-semibold text-gray-900 dark:text-white">{data.label}</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">GH₵{data.total?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{data.count} transactions</p>
          </div>
        ))}
      </div>

      {/* Premium Sellers List */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Premium Sellers</h2>
      {premiumSellers.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Star className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">No premium sellers yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {premiumSellers.map((seller: any) => (
            <div key={seller.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {seller.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{seller.fullName}</p>
                  <p className="text-xs text-gray-500">@{seller.username}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                  <Star className="w-3 h-3" /> Premium
                </span>
                <p className="text-xs text-gray-500 mt-1">Expires {seller.premiumExpiry ? new Date(seller.premiumExpiry).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
