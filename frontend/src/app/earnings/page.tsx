"use client";

import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { DollarSign, ShoppingCart, Users, Star, Download } from 'lucide-react';
import Link from 'next/link';

export default function EarningsPage() {
  const { data: noteEarnings } = useQuery({
    queryKey: ['noteEarnings'],
    queryFn: async () => { const { data } = await api.get('/revenue/notes/earnings'); return data.data; },
  });

  const { data: ticketSales } = useQuery({
    queryKey: ['ticketSales'],
    queryFn: async () => { const { data } = await api.get('/revenue/events/tickets/sales'); return data.data; },
  });

  const { data: premiumStatus } = useQuery({
    queryKey: ['premiumStatus'],
    queryFn: async () => { const { data } = await api.get('/revenue/premium/status'); return data.data; },
  });

  const noteTotals = noteEarnings?.totals;
  const ticketTotals = ticketSales?.totals;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-green-600" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Earnings & Finance</h1>
      </div>

      {/* Premium Status */}
      {premiumStatus?.isPremiumSeller && (
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">Premium Seller</p>
              <p className="text-white/80 text-sm">
                Your premium status expires {premiumStatus.premiumExpiry ? new Date(premiumStatus.premiumExpiry).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {!premiumStatus?.isPremiumSeller && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Become a Premium Seller</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get a premium badge on your profile and listings</p>
              </div>
            </div>
            <Link href="/subscriptions" className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-medium hover:bg-yellow-600 transition">
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                GH₵{((noteTotals?.totalEarnings || 0) + (ticketTotals?.totalEarnings || 0)).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Earnings</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{noteTotals?.totalSales || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Note Sales</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{ticketTotals?.totalTicketsSold || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tickets Sold</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                GH₵{((noteTotals?.totalPlatformFees || 0) + (ticketTotals?.totalPlatformFees || 0)).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Platform Fees Paid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Note Sales */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Note Sales</h2>
      {noteEarnings?.purchases?.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-8">
          <ShoppingCart className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No note sales yet</p>
          <Link href="/notes" className="text-blue-500 text-sm hover:underline mt-1 inline-block">Upload paid notes</Link>
        </div>
      ) : (
        <div className="space-y-2 mb-8">
          {noteEarnings?.purchases?.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{p.note.title}</p>
                <p className="text-xs text-gray-500">Bought by {p.buyer.fullName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 dark:text-green-400">+GH₵{p.uploaderEarning.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Sales */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Event Ticket Sales</h2>
      {ticketSales?.tickets?.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No ticket sales yet</p>
          <Link href="/events" className="text-blue-500 text-sm hover:underline mt-1 inline-block">Create paid events</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {ticketSales?.tickets?.map((t: any) => (
            <div key={t.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.event.title}</p>
                <p className="text-xs text-gray-500">Bought by {t.buyer.fullName} × {t.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600 dark:text-green-400">+GH₵{t.organizerEarning.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
