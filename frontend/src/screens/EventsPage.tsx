"use client";
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Event } from '../types';
import { formatDate } from '../utils';
import { MapPin, Users, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';

const eventCategories = [
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Social', value: 'SOCIAL' },
  { label: 'Sports', value: 'SPORTS' },
  { label: 'Cultural', value: 'CULTURAL' },
  { label: 'Tech', value: 'TECH' },
  { label: 'Career', value: 'CAREER' },
  { label: 'Other', value: 'OTHER' },
];

export function EventsPage() {
  const queryClient = useQueryClient();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data } = await api.get('/events?upcoming=true');
      return data.data;
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setVenue('');
      setDate('');
      setEndTime('');
      setCategory('ACADEMIC');
      setMaxAttendees('');
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Event created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create event');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { data } = await api.post(`/events/${eventId}/register`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Registered for event!');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !venue.trim() || !date) {
      toast.error('Please fill all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('venue', venue);
    formData.append('date', new Date(date).toISOString());
    if (endTime) formData.append('endTime', new Date(endTime).toISOString());
    formData.append('category', category);
    if (maxAttendees) formData.append('maxAttendees', maxAttendees);
    if (image) formData.append('image', image);

    createEventMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Campus Events</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Discover what's happening</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Create Event
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Featured Event */}
          {eventsData?.events?.[0] && (
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  This Week
                </span>
                <span className="text-xs text-white/80">
                  {formatDate(eventsData.events[0].date)}
                </span>
              </div>
              <h3 className="font-bold text-lg mt-3">{eventsData.events[0].title}</h3>
              <p className="text-sm text-white/80 mt-1 line-clamp-2">
                {eventsData.events[0].description}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {eventsData.events[0].venue}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {eventsData.events[0]._count.registrations} attending
                </span>
              </div>
              <Button
                className="mt-4 bg-white text-blue-600 hover:bg-gray-100"
                size="sm"
                onClick={() => registerMutation.mutate(eventsData.events[0].id)}
              >
                Register Now
              </Button>
            </div>
          )}

          {/* Other Events */}
          {eventsData?.events?.slice(1).map((event: Event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex flex-col items-center justify-center text-white">
                  <span className="text-[10px] font-semibold">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {new Date(event.date).getDate()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm dark:text-white">{event.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {event.venue}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-1">
                    {event.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-955 dark:text-white mb-4">Create Campus Event</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Event Title *</label>
                <Input
                  type="text"
                  placeholder="e.g. Hackathon 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description *</label>
                <textarea
                  placeholder="What is this event about? Highlights, guest speakers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Venue/Location *</label>
                <Input
                  type="text"
                  placeholder="e.g. Auditorium A"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Start Date & Time *</label>
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">End Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
                  >
                    {eventCategories.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Max Attendees</label>
                  <Input
                    type="number"
                    placeholder="e.g. 150"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Event Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  accept="image/*"
                  className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-300"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button variant="ghost" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
