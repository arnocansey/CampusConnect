"use client";
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { formatPrice } from './HostelPage';

export function HostelDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: hostel, isLoading } = useQuery({
    queryKey: ['hostel', id],
    queryFn: async () => {
      const { data } = await api.get(`/hostels/${id}`);
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-200 rounded-2xl mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!hostel) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Hostel Details</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
        <div className="h-48 bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center relative">
          <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Available
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">{hostel.name}</h2>
            <span className="text-blue-600 font-bold text-xl">{formatPrice(hostel.pricePerMonth || 0, hostel.currency || 'NGN')}/mo</span>
          </div>

          <p className="text-gray-500 flex items-center gap-1 mb-3">
            <MapPin className="w-4 h-4" /> {hostel.location}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(hostel.averageRating))}
              {'☆'.repeat(5 - Math.floor(hostel.averageRating))}
            </div>
            <span className="text-sm text-gray-500">
              {hostel.averageRating.toFixed(1)} ({hostel._count.reviews} reviews)
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">{hostel.description}</p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-1 dark:text-white">
              <MapPin className="w-4 h-4 text-blue-600" /> Location Map
            </h3>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 h-64 bg-gray-50 dark:bg-gray-800">
              <iframe
                title="Hostel Location Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${
                  hostel.latitude && hostel.longitude
                    ? `${hostel.latitude},${hostel.longitude}`
                    : encodeURIComponent(hostel.location)
                }&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Room Type</h3>
            <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
              {hostel.roomType}
            </span>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Facilities</h3>
            <div className="flex flex-wrap gap-2">
              {hostel.facilities.map((facility: string, i: number) => (
                <span key={i} className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-3 py-1 rounded-full">
                  {facility}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {hostel.contactPhone && (
              <Button variant="outline" className="flex-1">
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            )}
            {hostel.contactEmail && (
              <Button variant="outline" className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}
            <Button className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
