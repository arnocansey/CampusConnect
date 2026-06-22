"use client";
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MapPin, MessageCircle, Heart } from 'lucide-react';

export function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: item, isLoading } = useQuery({
    queryKey: ['marketplace-item', id],
    queryFn: async () => {
      const { data } = await api.get(`/marketplace/${id}`);
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-64 bg-gray-200 rounded-2xl mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold truncate">Item Details</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
        <div className="h-48 sm:h-64 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <span className="text-gray-400 text-lg">No image</span>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-lg sm:text-xl font-bold min-w-0 truncate">{item.title}</h2>
            <span className="text-blue-600 font-bold text-lg sm:text-2xl shrink-0">GH₵{item.price?.toLocaleString()}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-gray-500">
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs">{item.category}</span>
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-xs">{item.condition}</span>
            {item.location && (
              <span className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3" /> {item.location}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(item.averageRating))}
              {'☆'.repeat(5 - Math.floor(item.averageRating))}
            </div>
            <span className="text-sm text-gray-500">
              {item.averageRating.toFixed(1)} ({item._count.reviews} reviews)
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-line">{item.description}</p>

          {/* Seller */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {item.seller.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-sm">{item.seller.fullName}</p>
                <p className="text-xs text-gray-500">@{item.seller.username}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat Seller
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
