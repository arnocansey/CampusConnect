"use client";
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { formatDate } from '../utils';
import { Button } from '../components/ui/Button';
import { ArrowLeft, MapPin, Calendar, Users, Clock, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data } = await api.get(`/events/${id}`);
      return data.data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/events/${id}/register`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success(`Registered! Ticket: ${data.data.ticketCode.slice(0, 8)}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/events/${id}/register`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success('Registration cancelled');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-gray-200 rounded-2xl mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
      </div>
    );
  }

  if (!event) return null;

  const eventDate = new Date(event.date);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold truncate">Event Details</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
        <div className="h-40 sm:h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative">
          <div className="text-center text-white">
            <span className="text-4xl font-bold">{eventDate.getDate()}</span>
            <span className="block text-lg">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h2 className="text-lg sm:text-xl font-bold min-w-0 truncate">{event.title}</h2>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full font-semibold shrink-0">
              {event.category}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {event.venue}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" /> {event._count.registrations} attending
            </span>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-line">{event.description}</p>

          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-1 dark:text-white">
              <MapPin className="w-4 h-4 text-blue-600" /> Venue Map
            </h3>
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 h-64 bg-gray-50 dark:bg-gray-800">
              <iframe
                title="Event Venue Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <span>Organized by</span>
            <span className="font-semibold text-gray-900 dark:text-white">{event.organizer.fullName}</span>
          </div>

          {event.isRegistered ? (
            <div className="space-y-2">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
                <Ticket className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">You're registered!</p>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Ticket: {event.ticketCode?.slice(0, 8)}
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => cancelMutation.mutate()}>
                Cancel Registration
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={() => registerMutation.mutate()}>
              Register Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
