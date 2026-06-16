"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, X, Crown, TrendingUp, Users, CreditCard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  adsRemaining: number;
  adsUsed: number;
  expiresAt: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string; username: string };
  plan: { id: string; name: string; price: number; adLimit: number; durationDays: number };
}

interface Plan {
  id: string;
  name: string;
  price: number;
  adLimit: number;
  durationDays: number;
  isActive: boolean;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
}

export default function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [deletingSub, setDeletingSub] = useState<Subscription | null>(null);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [editPlanId, setEditPlanId] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editAdsRemaining, setEditAdsRemaining] = useState<number>(0);
  const [editStatus, setEditStatus] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ['adminSubscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/admin/subscriptions?limit=100');
      return data;
    },
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ['adminPlans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/admin/plans');
      return data.data;
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/admin/revenue');
      return data.data;
    },
  });

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const { data } = await api.get(`/admin/users?search=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(data.data || []);
    } catch {
      setSearchResults([]);
    }
  };

  // Create subscription
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/subscriptions/admin/subscriptions', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['adminRevenue'] });
      setShowCreateModal(false);
      resetForm();
      toast.success('Subscription created!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create subscription');
    },
  });

  // Update subscription
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/subscriptions/admin/subscriptions/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      setEditingSub(null);
      resetForm();
      toast.success('Subscription updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update subscription');
    },
  });

  // Delete subscription
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subscriptions/admin/subscriptions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['adminRevenue'] });
      setDeletingSub(null);
      toast.success('Subscription deleted!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete subscription');
    },
  });

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedPlanId('');
    setExpiresAt('');
    setUserSearch('');
    setSearchResults([]);
  };

  const openEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setEditPlanId(sub.planId);
    setEditExpiresAt(format(new Date(sub.expiresAt), 'yyyy-MM-dd'));
    setEditAdsRemaining(sub.adsRemaining === -1 ? -1 : sub.adsRemaining - sub.adsUsed);
    setEditStatus(sub.status);
  };

  const subscriptions: Subscription[] = subscriptionsData?.data || [];
  const totalSubs = subscriptionsData?.total || 0;

  const selectedUser = searchResults.find(u => u.id === selectedUserId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage user subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] })}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Create Subscription
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="font-bold text-gray-900 dark:text-white">GH₵{revenueData?.totalRevenue || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</p>
              <p className="font-bold text-gray-900 dark:text-white">GH₵{revenueData?.monthlyRevenue || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Payments</p>
              <p className="font-bold text-gray-900 dark:text-white">{revenueData?.totalPayments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Subs</p>
              <p className="font-bold text-gray-900 dark:text-white">{revenueData?.activeSubscriptions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ads Left</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Expires</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No subscriptions found</td></tr>
              ) : subscriptions.map(sub => (
                <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{sub.user.fullName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">@{sub.user.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      <Crown className="w-3 h-3" />
                      {sub.plan.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      sub.status === 'EXPIRED' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {sub.adsRemaining === -1 ? '∞' : sub.adsRemaining}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {format(new Date(sub.expiresAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(sub)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingSub(sub)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalSubs > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
            {totalSubs} total subscription{totalSubs !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowCreateModal(false); resetForm(); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Subscription</h2>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* User search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User</label>
                {selectedUser ? (
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedUser.fullName}</p>
                      <p className="text-xs text-gray-500">@{selectedUser.username}</p>
                    </div>
                    <button onClick={() => { setSelectedUserId(''); setUserSearch(''); setSearchResults([]); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Search by name or username..."
                      value={userSearch}
                      onChange={e => {
                        setUserSearch(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    {searchResults.length > 0 && (
                      <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg max-h-40 overflow-y-auto">
                        {searchResults.map(user => (
                          <button
                            key={user.id}
                            onClick={() => { setSelectedUserId(user.id); setSearchResults([]); setUserSearch(user.fullName); }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                          >
                            <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                            <p className="text-xs text-gray-500">@{user.username}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
                <select
                  value={selectedPlanId}
                  onChange={e => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Select plan...</option>
                  {plans.filter(p => p.isActive).map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — GH₵{plan.price} ({plan.adLimit === -1 ? 'Unlimited' : plan.adLimit} ads, {plan.durationDays}d)
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires At</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  if (!selectedUserId || !selectedPlanId || !expiresAt) {
                    toast.error('Please fill all fields');
                    return;
                  }
                  createMutation.mutate({ userId: selectedUserId, planId: selectedPlanId, expiresAt });
                }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setEditingSub(null); resetForm(); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Subscription</h2>
              <button onClick={() => { setEditingSub(null); resetForm(); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{editingSub.user.fullName}</p>
                <p className="text-xs text-gray-500">@{editingSub.user.username}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
                <select
                  value={editPlanId}
                  onChange={e => setEditPlanId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  {plans.filter(p => p.isActive).map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} — GH₵{plan.price} ({plan.adLimit === -1 ? 'Unlimited' : plan.adLimit} ads, {plan.durationDays}d)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expires At</label>
                <input
                  type="date"
                  value={editExpiresAt}
                  onChange={e => setEditExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ads Remaining (-1 = unlimited)</label>
                <input
                  type="number"
                  value={editAdsRemaining}
                  onChange={e => setEditAdsRemaining(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => { setEditingSub(null); resetForm(); }}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  updateMutation.mutate({
                    id: editingSub.id,
                    planId: editPlanId,
                    expiresAt: editExpiresAt,
                    adsRemaining: editAdsRemaining,
                    status: editStatus,
                  });
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeletingSub(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Subscription?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              This will remove <strong>{deletingSub.user.fullName}</strong>&apos;s <strong>{deletingSub.plan.name}</strong> subscription.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeletingSub(null)}>Cancel</Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteMutation.mutate(deletingSub.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
