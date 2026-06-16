"use client";
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { MarketplaceItem } from '../types';
import { Search, ShoppingCart, Star, X, Plus, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n';


const categoryButtons = [
  { label: 'All', value: 'All', icon: '🏷️' },
  { label: 'Fashion', value: 'CLOTHING', icon: '👕' },
  { label: 'Electronics', value: 'ELECTRONICS', icon: '💻' },
  { label: 'Accessories', value: 'ACCESSORIES', icon: '👜' },
  { label: 'Books', value: 'BOOKS', icon: '📚' },
  { label: 'Services', value: 'SERVICES', icon: '🛠️' },
];

export function MarketplacePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Listing modal states
  const [showSellModal, setShowSellModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('BOOKS');
  const [condition, setCondition] = useState('USED');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<FileList | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['marketplace', searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      const { data } = await api.get(`/marketplace?${params}`);
      return data.data;
    },
  });

  const { data: mySub } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/my-subscription');
      return data.data;
    },
  });

  const canPost = mySub && (mySub.adsRemaining === -1 || mySub.adsRemaining > 0);

  const createItemMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/marketplace', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
      setShowSellModal(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('BOOKS');
      setCondition('USED');
      setLocation('');
      setImages(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(t('marketplace.listSuccessful'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to list item');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price.trim() || !location.trim()) {
      toast.error(t('marketplace.fillRequired'));
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('category', category);
    formData.append('condition', condition);
    formData.append('location', location);
    formData.append('currency', 'GHS');
    
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    createItemMutation.mutate(formData);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="flex-1 min-w-0 max-w-4xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{t('marketplace.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">{t('marketplace.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mySub && (
              <span className={`text-xs px-2.5 py-1.5 rounded-full font-medium ${
                canPost
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {mySub.adsRemaining === -1 ? '∞ listings' : `${mySub.adsRemaining} listings left`}
              </span>
            )}
            {canPost ? (
              <Button size="sm" onClick={() => setShowSellModal(true)} className="whitespace-nowrap">
                <Plus className="w-4 h-4 mr-1" />
                {t('marketplace.sellItem')}
              </Button>
            ) : (
              <Link href="/subscriptions">
                <Button size="sm" className="whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <Crown className="w-4 h-4 mr-1" />
                  {mySub ? 'Get More Listings' : 'Subscribe to Sell'}
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 mb-4 transition-colors">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('marketplace.searchProducts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
            />
          </div>
        </div>

        {/* Category Icons */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categoryButtons.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex flex-col items-center gap-1.5 min-w-[72px] shrink-0 p-3 rounded-2xl transition ${
                selectedCategory === cat.value
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className={`text-xs font-medium ${selectedCategory === cat.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl sm:p-6 p-4 text-white mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">{t('marketplace.summerSale')}</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 sm:mt-3">{t('marketplace.upTo50Off')}</h2>
            <p className="text-white/80 mt-1 text-xs sm:text-sm">{t('marketplace.discoverDeals')}</p>
            <Button className="mt-4 bg-white text-blue-600 hover:bg-gray-100" size="sm">{t('marketplace.shopNow')}</Button>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-8xl opacity-20 hidden sm:block">🛍️</div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
                <div className="h-32 sm:h-40 md:h-48 bg-gray-200 dark:bg-gray-700" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {itemsData?.items?.map((item: MarketplaceItem) => (
              <Link
                key={item.id}
                href={`/marketplace/${item.id}`}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition group"
              >
                {item.images?.[0] ? (
                  <div className="relative h-32 sm:h-40 md:h-48 overflow-hidden">
                    <img src={item.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  </div>
                ) : (
                  <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-semibold text-sm truncate dark:text-white">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">GH₵{item.price?.toLocaleString()}</p>
                    {item.averageRating != null && item.averageRating > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.averageRating?.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px]">
                      {item.seller.fullName?.charAt(0)}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{item.seller.fullName}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {itemsData?.items?.length === 0 && (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('marketplace.noItemsFound')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('marketplace.tryDifferent')}</p>
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowSellModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-950 dark:text-white mb-4">{t('marketplace.listForSale')}</h2>
            {mySub && mySub.adsRemaining !== -1 && mySub.adsRemaining <= 1 && (
              <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${
                mySub.adsRemaining === 0
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {mySub.adsRemaining === 0
                    ? 'No listings remaining. '
                    : 'This is your last free listing. '}
                  <Link href="/subscriptions" className="font-semibold underline" onClick={() => setShowSellModal(false)}>
                    Upgrade plan
                  </Link>
                </span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('marketplace.itemTitle')}</label>
                <Input
                  type="text"
                  placeholder="e.g. iPhone 13 Pro Max"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('marketplace.description')}</label>
                <textarea
                  placeholder="Tell buyers about your item (condition, specs, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('marketplace.price')}</label>
                  <Input
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('marketplace.location')}</label>
                  <Input
                    type="text"
                    placeholder="e.g. Joju Hostel"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('marketplace.category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
                  >
                    <option value="BOOKS">BOOKS</option>
                    <option value="ELECTRONICS">ELECTRONICS</option>
                    <option value="CLOTHING">CLOTHING</option>
                    <option value="ACCESSORIES">ACCESSORIES</option>
                    <option value="SERVICES">SERVICES</option>
                    <option value="HOSTEL_ITEMS">HOSTEL ITEMS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('marketplace.condition')}</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
                  >
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="USED">Used</option>
                    <option value="FAIR">Fair</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('marketplace.itemImages')}</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setImages(e.target.files)}
                  accept="image/*"
                  multiple
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" type="button" onClick={() => setShowSellModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createItemMutation.isPending}>
                  {createItemMutation.isPending ? t('marketplace.listing') : t('marketplace.listItem')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
