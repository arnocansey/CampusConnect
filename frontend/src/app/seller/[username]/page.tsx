"use client";

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import Link from 'next/link';
import { Star, MapPin, Shield, Calendar, Package, ShoppingCart, ArrowLeft, MessageCircle } from 'lucide-react';
import Image from 'next/image';

interface SellerData {
  seller: {
    id: string;
    username: string;
    fullName: string;
    profilePicture: string | null;
    bio: string | null;
    isVerified: boolean;
    createdAt: string;
    university: { name: string } | null;
  };
  items: any[];
  stats: {
    totalListings: number;
    totalSold: number;
    averageRating: number;
    totalReviews: number;
  };
  subscription: { plan: string } | null;
  recentReviews: any[];
}

export default function SellerStorefrontPage() {
  const params = useParams();
  const username = params.username as string;

  const { data, isLoading, error } = useQuery<SellerData>({
    queryKey: ['sellerStorefront', username],
    queryFn: async () => {
      const { data } = await api.get(`/marketplace/seller/${username}`);
      return data.data;
    },
    enabled: !!username,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto p-4 text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 text-lg">Seller not found</p>
        <Link href="/marketplace" className="text-blue-500 hover:underline mt-2 inline-block">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const { seller, items, stats, subscription, recentReviews } = data;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      {/* Seller Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-lg">
              {seller.profilePicture ? (
                <Image src={seller.profilePicture} alt={seller.fullName} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {seller.fullName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{seller.fullName}</h1>
                {seller.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
                {subscription && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    {subscription.plan} Seller
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{seller.username}</p>
              {seller.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{seller.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                {seller.university && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {seller.university.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Joined {new Date(seller.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <Link
              href={`/messages?user=${seller.username}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition shrink-0"
            >
              <MessageCircle className="w-4 h-4" /> Message Seller
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalListings}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalSold}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sold</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalReviews}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" /> Products ({items.length})
          </h2>
          {items.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No active listings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {items.map(item => (
                <Link
                  key={item.id}
                  href={`/marketplace/${item.id}`}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition group"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                    {item.images?.[0] ? (
                      <Image src={item.images[0]} alt={item.title} fill className="object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                    {item.condition && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-300">
                        {item.condition}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">{item.title}</h3>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                      GH₵{item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      {item.location && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" /> {item.location}
                        </span>
                      )}
                      {item._count?.reviews > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Star className="w-3 h-3" /> {item._count.reviews}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Sidebar */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Reviews</h2>
          {recentReviews.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <Star className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map(review => (
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{review.reviewer.fullName}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    on <span className="text-gray-500 dark:text-gray-400">{review.item.title}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
