"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import Link from 'next/link';
import { Store, Star, Package, ShoppingCart, TrendingUp, Crown, Edit, Trash2, Eye, ExternalLink, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ShopData {
  activeListings: any[];
  soldItems: any[];
  stats: {
    totalActive: number;
    totalSold: number;
    totalViews: number;
    averageRating: number;
    totalReviews: number;
  };
  subscription: {
    plan: string;
    adsRemaining: number;
    adsUsed: number;
    expiresAt: string;
  } | null;
  recentReviews: any[];
}

export default function MyShopPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', price: 0, category: '', condition: '', location: '' });

  const { data: shopData, isLoading } = useQuery<ShopData>({
    queryKey: ['myShop'],
    queryFn: async () => {
      const { data } = await api.get('/marketplace/my-shop');
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/marketplace/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShop'] });
      toast.success('Listing deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put(`/marketplace/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShop'] });
      setEditingItem(null);
      toast.success('Listing updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const markSoldMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/marketplace/${id}`, { isSold: true });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShop'] });
      toast.success('Marked as sold');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const openEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      price: item.price,
      category: item.category || '',
      condition: item.condition || '',
      location: item.location || '',
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = shopData?.stats;
  const listings = shopData?.activeListings || [];
  const sold = shopData?.soldItems || [];
  const sub = shopData?.subscription;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Shop</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Manage your marketplace listings</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user && (
            <Link
              href={`/seller/${user.username}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              <ExternalLink className="w-4 h-4" /> View Storefront
            </Link>
          )}
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" /> New Listing
          </Link>
        </div>
      </div>

      {/* Subscription Banner */}
      {sub && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 opacity-80" />
              <div>
                <p className="font-bold text-lg">{sub.plan} Plan</p>
                <p className="text-white/80 text-sm">
                  {sub.adsRemaining === -1 ? 'Unlimited listings' : `${sub.adsRemaining} listings remaining`}
                  {' · '}Expires {new Date(sub.expiresAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Link
              href="/subscriptions"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition"
            >
              Manage Subscription
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalActive || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Listings</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalSold || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Items Sold</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalReviews || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Active Listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-3">No active listings</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition"
            >
              <Plus className="w-4 h-4" /> Create your first listing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4 items-center">
                <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                  {item.images?.[0] ? (
                    <Image src={item.images[0]} alt={item.title} width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.title}</h3>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">GH₵{item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {item.category && <span>{item.category}</span>}
                    {item.condition && <span>{item.condition}</span>}
                    {item.location && <span>{item.location}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/marketplace/${item.id}`}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => markSoldMutation.mutate(item.id)}
                    className="p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500"
                    title="Mark as Sold"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this listing?')) deleteMutation.mutate(item.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sold Items */}
      {sold.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recently Sold ({sold.length})</h2>
          <div className="space-y-2">
            {sold.map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sold {new Date(item.updatedAt).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-green-600 dark:text-green-400">GH₵{item.price.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {shopData?.recentReviews && shopData.recentReviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {shopData.recentReviews.map((review: any) => (
              <div key={review.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {review.reviewer.profilePicture ? (
                      <Image src={review.reviewer.profilePicture} alt={review.reviewer.fullName} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                        {review.reviewer.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{review.reviewer.fullName}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {review.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">on <span className="text-gray-500">{review.item.title}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingItem(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Listing</h2>
              <button onClick={() => setEditingItem(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (GH₵)</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                  <select
                    value={editForm.condition}
                    onChange={e => setEditForm({ ...editForm, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => updateMutation.mutate({ id: editingItem.id, ...editForm })}
                disabled={updateMutation.isPending || !editForm.title}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
