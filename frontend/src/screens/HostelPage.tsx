"use client";
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Hostel } from '../types';
import { Search, MapPin, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';

export const formatPrice = (price: number, currency: string) => {
  const symbol = currency === 'GHS' ? 'GH₵' : currency === 'USD' ? '$' : currency === 'NGN' ? '₦' : currency + ' ';
  return `${symbol}${price.toLocaleString()}`;
};

const roomTypes = ['All', 'Single', 'Shared', 'Self-Contained'];
const roomTypeOptions = [
  { label: 'Single Room', value: 'SINGLE' },
  { label: 'Shared Room', value: 'SHARED' },
  { label: 'Self-Contained', value: 'SELF_CONTAINED' },
];
const facilityOptions = ['WiFi', 'Water', '24/7 Power', 'AC', 'Laundry'];

export function HostelPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Modal states
  const [showListModal, setShowListModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerMonth, setPricePerMonth] = useState('');
  const [currency, setCurrency] = useState('GHS');
  const [roomType, setRoomType] = useState('SINGLE');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [images, setImages] = useState<FileList | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const roomTypeMap: Record<string, string> = {
    'Single': 'SINGLE',
    'Shared': 'SHARED',
    'Self-Contained': 'SELF_CONTAINED',
  };

  const { data: hostelsData, isLoading } = useQuery({
    queryKey: ['hostels', searchQuery, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType !== 'All') {
        params.append('roomType', roomTypeMap[selectedType] || selectedType);
      }
      const { data } = await api.get(`/hostels?${params}`);
      return data.data;
    },
  });

  const createHostelMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/hostels', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostels'] });
      setShowListModal(false);
      setName('');
      setDescription('');
      setLocation('');
      setPricePerMonth('');
      setCurrency('GHS');
      setRoomType('SINGLE');
      setFacilities([]);
      setContactPhone('');
      setContactEmail('');
      setLatitude('');
      setLongitude('');
      setImages(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Hostel listed successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to list hostel');
    },
  });

  const handleFacilityChange = (facility: string) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !location.trim() || !pricePerMonth.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('pricePerMonth', pricePerMonth);
    formData.append('roomType', roomType);
    formData.append('facilities', JSON.stringify(facilities));
    formData.append('contactPhone', contactPhone);
    formData.append('contactEmail', contactEmail);
    formData.append('currency', currency);
    if (latitude.trim()) {
      formData.append('latitude', latitude);
    }
    if (longitude.trim()) {
      formData.append('longitude', longitude);
    }

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    createHostelMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">🏠 Hostel Finder</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">Find your perfect accommodation</p>
        </div>
        <Button size="sm" onClick={() => setShowListModal(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1" />
          List Hostel
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-2 mb-4 transition-colors">
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search hostels near campus..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
        />
      </div>

      {/* Room Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {roomTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition ${
              selectedType === type
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Hostels List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700" />
              <div className="p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {hostelsData?.hostels?.map((hostel: Hostel) => (
            <Link
              key={hostel.id}
              href={`/hostels/${hostel.id}`}
              className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition"
            >
              {hostel.images?.[0] ? (
                <img src={hostel.images[0]} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 bg-gradient-to-br from-blue-200 to-blue-400 dark:from-blue-800 dark:to-blue-600 flex items-center justify-center relative">
                  <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    Available
                  </span>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm dark:text-white">{hostel.name}</p>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(hostel.pricePerMonth || 0, hostel.currency || 'GHS')}/mo</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {hostel.location}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>🛏️ {hostel.roomType}</span>
                  {hostel.facilities?.includes('WiFi') && <span>📶 WiFi</span>}
                  {hostel.facilities?.includes('Water') && <span>💧 Water</span>}
                  {hostel.facilities?.includes('24/7 Power') && <span>⚡ Power</span>}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex text-yellow-400 text-xs">
                    {'★'.repeat(Math.floor(hostel.averageRating || 0))}
                    {'☆'.repeat(5 - Math.floor(hostel.averageRating || 0))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {hostel.averageRating?.toFixed(1)} ({hostel._count?.reviews} reviews)
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* List Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowListModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-955 dark:text-white mb-4">List an Accommodation</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Hostel/Apartment Name *</label>
                <Input
                  type="text"
                  placeholder="e.g. Royal Palms Suite"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description *</label>
                <textarea
                  placeholder="Tell students about rooms, environment, amenities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Price per Month (GH₵) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm z-10">GH₵</span>
                  <Input
                    type="number"
                    placeholder="e.g. 150"
                    value={pricePerMonth}
                    onChange={(e) => setPricePerMonth(e.target.value)}
                    className="pl-12"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Location/Address *</label>
                <Input
                  type="text"
                  placeholder="e.g. Northern Campus (Science)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Latitude (Optional)</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 6.5244"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Longitude (Optional)</label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="e.g. 3.3792"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Room Type *</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
                >
                  {roomTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Facilities Available</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {facilityOptions.map((facility) => (
                    <label key={facility} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={facilities.includes(facility)}
                        onChange={() => handleFacilityChange(facility)}
                        className="rounded text-blue-600"
                      />
                      {facility}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Contact Phone</label>
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Contact Email</label>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Images</label>
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
                <Button variant="ghost" type="button" onClick={() => setShowListModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createHostelMutation.isPending}>
                  {createHostelMutation.isPending ? 'Listing...' : 'List Accommodation'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
