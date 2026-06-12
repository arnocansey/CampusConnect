"use client";
import { useState, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import { formatDate, formatNumber } from '../utils';
import { Button } from '../components/ui/Button';
import { StoryTray } from '../components/feed/StoryTray';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, X, Bookmark, MapPin, BarChart3, Video, Tag, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const CAMPUS_LOCATIONS = [
  'Main Library',
  'Student Center',
  'Cafeteria',
  'Lecture Hall A',
  'Lecture Hall B',
  'Computer Lab',
  'Gymnasium',
  'Quad / Courtyard',
  'Admin Building',
  'Parking Lot',
];

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [hashtags, setHashtags] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpires, setPollExpires] = useState<string>('never');
  const [showLocation, setShowLocation] = useState(false);
  const [location, setLocation] = useState('');
  const [locationMode, setLocationMode] = useState<'preset' | 'custom'>('preset');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await api.get('/posts/feed');
      return data.data;
    },
  });

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const { data } = await api.get('/posts/trending');
      return data.data;
    },
  });

  const { data: suggestedData } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: async () => {
      const { data } = await api.get('/users/suggested');
      return data.data;
    },
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/users/${userId}/follow`);
      return data.data;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['suggestedUsers'] });
      const previousSuggested = queryClient.getQueryData(['suggestedUsers']);
      queryClient.setQueryData(['suggestedUsers'], (old: any) => {
        if (!old) return old;
        return old.filter((u: any) => u.id !== userId);
      });
      return { previousSuggested };
    },
    onError: (_err, _userId, context) => {
      if (context?.previousSuggested) {
        queryClient.setQueryData(['suggestedUsers'], context.previousSuggested);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      resetComposer();
      toast.success(t('home.postCreated'));
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ postId, optionId }: { postId: string; optionId: string }) => {
      const { data } = await api.post(`/posts/${postId}/vote`, { optionId });
      return data.data;
    },
    onMutate: async ({ postId, optionId }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData(['feed']);
      queryClient.setQueryData(['feed'], (old: any) => ({
        ...old,
        posts: old.posts.map((post: Post) => {
          if (post.id !== postId || !post.poll) return post;
          const prevVote = post.poll.userVote;
          const newVote = prevVote === optionId ? null : optionId;
          return {
            ...post,
            poll: {
              ...post.poll,
              userVote: newVote,
              options: post.poll.options.map((opt: any) => ({
                ...opt,
                _count: {
                  votes:
                    opt._count.votes
                    + (opt.id === optionId ? (prevVote === optionId ? -1 : 1) : (prevVote === optionId ? -1 : 0)),
                },
              })),
            },
          };
        }),
      }));
      return { previousFeed };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post(`/posts/${postId}/like`);
      return data.data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData(['feed']);
      queryClient.setQueryData(['feed'], (old: any) => ({
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                _count: {
                  ...post._count,
                  likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1,
                },
              }
            : post
        ),
      }));
      return { previousFeed };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post(`/posts/${postId}/save`);
      return data.data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData(['feed']);
      queryClient.setQueryData(['feed'], (old: any) => ({
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === postId ? { ...post, isSaved: !post.isSaved } : post
        ),
      }));
      return { previousFeed };
    },
  });

  const resetComposer = () => {
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setHashtags('');
    setShowPoll(false);
    setPollOptions(['', '']);
    setPollExpires('never');
    setShowLocation(false);
    setLocation('');
    setShowCreatePost(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoFile) {
        setVideoFile(null);
        setVideoPreview(null);
        if (videoInputRef.current) videoInputRef.current.value = '';
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imageFile) {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const updated = [...pollOptions];
    updated[index] = value;
    setPollOptions(updated);
  };

  const handleCreatePost = () => {
    const hasContent = content.trim();
    const hasMedia = imageFile || videoFile;
    const hasPoll = showPoll && pollOptions.filter(o => o.trim()).length >= 2;

    if (!hasContent && !hasMedia && !hasPoll) return;

    const formData = new FormData();
    formData.append('content', content);

    if (imageFile) {
      formData.append('images', imageFile);
    }

    if (videoFile) {
      formData.append('images', videoFile);
    }

    if (location) {
      formData.append('location', location);
    }

    const tagList = hashtags.split(/[\s,]+/).filter(t => t.startsWith('#') ? t.slice(1) : t).map(t => t.startsWith('#') ? t.slice(1) : t);
    if (tagList.length > 0) formData.append('tags', JSON.stringify(tagList));

    if (hasPoll) {
      const expiresMap: Record<string, number> = {
        never: 0,
        oneDay: 86400000,
        threeDays: 259200000,
        sevenDays: 604800000,
      };
      const pollPayload = {
        options: pollOptions.filter(o => o.trim()),
        expiresAt: expiresMap[pollExpires] ? new Date(Date.now() + expiresMap[pollExpires]).toISOString() : null,
      };
      formData.append('poll', JSON.stringify(pollPayload));
    }

    createPostMutation.mutate(formData);
  };

  const totalPollVotes = (poll: any) =>
    poll?.options?.reduce((sum: number, opt: any) => sum + (opt._count?.votes || 0), 0) || 0;

  const isPollClosed = (poll: any) =>
    poll?.expiresAt && new Date(poll.expiresAt) < new Date();

  return (
    <div className="max-w-7xl mx-auto p-4 flex gap-6">
      {/* Main Feed */}
      <div className="flex-1 max-w-2xl min-w-0">
        <StoryTray />

        {/* Post Composer */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.fullName?.charAt(0)
              )}
            </div>
            <div
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-3 text-gray-500 dark:text-gray-400 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition min-w-0"
              onClick={() => setShowCreatePost(true)}
            >
              {`${t('home.whatsOnYourMind')}, ${user?.fullName?.split(' ')[0]}?`}
            </div>
          </div>

          {showCreatePost && (
            <div className="mt-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('home.whatToShare')}
                maxLength={3000}
                className="w-full h-32 resize-none text-sm placeholder-gray-400 dark:placeholder-gray-500 border-none focus:ring-0 p-0 bg-transparent dark:text-white"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{content.length}/3000</p>

              {imagePreview && (
                <div className="relative mt-2 mb-3">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  <button onClick={removeImage} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {videoPreview && (
                <div className="relative mt-2 mb-3">
                  <video src={videoPreview} controls className="w-full max-h-64 rounded-xl bg-black" />
                  <button onClick={removeVideo} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {showPoll && (
                <div className="mt-3 mb-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold dark:text-white">{t('home.poll')}</p>
                    <button onClick={() => { setShowPoll(false); setPollOptions(['', '']); }} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updatePollOption(i, e.target.value)}
                        placeholder={`${t('home.addOption')} ${i + 1}`}
                        className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {pollOptions.length > 2 && (
                        <button onClick={() => removePollOption(i)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 6 && (
                    <button onClick={addPollOption} className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium">
                      <Plus className="w-4 h-4" /> {t('home.addOption')}
                    </button>
                  )}
                  <select
                    value={pollExpires}
                    onChange={(e) => setPollExpires(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="never">{t('home.never')}</option>
                    <option value="oneDay">{t('home.oneDay')}</option>
                    <option value="threeDays">{t('home.threeDays')}</option>
                    <option value="sevenDays">{t('home.sevenDays')}</option>
                  </select>
                </div>
              )}

              {showLocation && (
                <div className="mt-3 mb-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold dark:text-white">{t('home.location')}</p>
                    <button onClick={() => { setShowLocation(false); setLocation(''); }} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => { setLocationMode('preset'); setLocation(''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${locationMode === 'preset' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      {t('home.selectLocation')}
                    </button>
                    <button
                      onClick={() => { setLocationMode('custom'); setLocation(''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${locationMode === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                    >
                      {t('home.customLocation')}
                    </button>
                  </div>
                  {locationMode === 'preset' ? (
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none"
                    >
                      <option value="">-- Select --</option>
                      {CAMPUS_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('home.customLocation')}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder={t('home.addHashtags')}
                  className="flex-1 text-sm bg-transparent focus:outline-none dark:text-white dark:placeholder-gray-500 min-w-0"
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                <div className="flex flex-wrap gap-1">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoSelect} />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
                    <Image className="w-5 h-5 text-green-500" /> <span className="hidden sm:inline">{t('home.photo')}</span>
                  </button>
                  <button onClick={() => videoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
                    <Video className="w-5 h-5 text-blue-500" /> <span className="hidden sm:inline">{t('home.video')}</span>
                  </button>
                  <button onClick={() => setShowPoll(!showPoll)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm ${showPoll ? 'text-orange-500 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                    <BarChart3 className="w-5 h-5 text-orange-500" /> <span className="hidden sm:inline">{t('home.poll')}</span>
                  </button>
                  <button onClick={() => setShowLocation(!showLocation)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm ${showLocation ? 'text-red-500 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                    <MapPin className="w-5 h-5 text-red-500" /> <span className="hidden sm:inline">{t('home.location')}</span>
                  </button>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={resetComposer}>{t('common.cancel')}</Button>
                  <Button size="sm" onClick={handleCreatePost} disabled={(!content.trim() && !imageFile && !videoFile && !(showPoll && pollOptions.filter(o => o.trim()).length >= 2)) || createPostMutation.isPending}>
                    {t('common.post')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Link
            href="/notes"
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col items-center"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📚</div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('home.lectureNotes')}</p>
          </Link>
          <Link
            href="/marketplace"
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col items-center"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🛍️</div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('home.marketplaceLabel')}</p>
          </Link>
          <Link
            href="/groups"
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col items-center"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('home.studyGroups')}</p>
          </Link>
          <Link
            href="/hostels"
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col items-center"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏠</div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('home.hostelFinder')}</p>
          </Link>
          <Link
            href="/jobs"
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col items-center"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💼</div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('home.jobsLabel')}</p>
          </Link>
          <Link
            href="/events"
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group flex flex-col items-center"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📅</div>
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t('home.eventsLabel')}</p>
          </Link>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {feedData?.posts?.map((post: Post) => {
              const pollVotes = totalPollVotes(post.poll);
              const pollClosed = isPollClosed(post.poll);

              return (
              <div key={post.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                <div className="p-4 flex items-center justify-between">
                  <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {post.author.profilePicture ? (
                        <img src={post.author.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        post.author.fullName?.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm dark:text-white truncate">{post.author.fullName}</p>
                        {post.author.isVerified && (
                          <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{post.author.username} · {formatDate(post.createdAt)}</p>
                    </div>
                  </Link>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {post.location && (
                  <div className="px-4 pb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">{post.location}</span>
                  </div>
                )}

                {post.content && (
                  <div className="px-4 pb-3">
                    <p className="text-sm leading-relaxed dark:text-white whitespace-pre-wrap">{post.content}</p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {post.tags.map((tag: string) => (
                          <span key={tag} className="text-xs text-blue-500 dark:text-blue-400 font-medium">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {post.videoUrl && (
                  <div className="px-4 pb-3">
                    <video src={post.videoUrl} controls className="w-full max-h-96 rounded-xl bg-black" />
                  </div>
                )}

                {post.images?.length > 0 && (
                  <div className="px-4 pb-3">
                    {post.images.length === 1 ? (
                      <img src={post.images[0]} alt="" className="rounded-xl w-full object-cover max-h-96" />
                    ) : (
                      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
                        {post.images.slice(0, 4).map((img: string, idx: number) => (
                          <div key={idx} className="relative">
                            <img src={img} alt="" className="w-full h-40 object-cover" />
                            {idx === 3 && post.images.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white text-2xl font-bold">+{post.images.length - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {post.poll && (
                  <div className="px-4 pb-3 space-y-2">
                    {post.poll.options.map((option: any) => {
                      const pct = pollVotes > 0 ? Math.round((option._count.votes / pollVotes) * 100) : 0;
                      const isSelected = post.poll!.userVote === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => !pollClosed && voteMutation.mutate({ postId: post.id, optionId: option.id })}
                          disabled={pollClosed}
                          className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition relative overflow-hidden ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          } ${pollClosed ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {pollVotes > 0 && (
                            <div
                              className={`absolute inset-0 transition-all duration-500 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <span className="dark:text-white font-medium">{option.text}</span>
                            {pollVotes > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{pct}%</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatNumber(pollVotes)} {t('home.votes')}
                      {pollClosed && ` · ${t('home.pollClosed')}`}
                    </p>
                  </div>
                )}

                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatNumber(post._count.likes)} likes · {formatNumber(post._count.comments)} comments</span>
                </div>

                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1">
                  <button
                    onClick={() => likeMutation.mutate(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${post.isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{t('common.like')}</span>
                  </button>
                  <Link href={`/post/${post.id}`} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('common.comment')}</span>
                  </Link>
                  <button
                    onClick={() => saveMutation.mutate(post.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${post.isSaved ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-300'}`}
                  >
                    <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{t('common.save')}</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('common.share')}</span>
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-[73px] space-y-4">
          {/* Trending Topics */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">{t('home.trendingTopics')}</h3>
            </div>
            {trendingData?.length > 0 ? (
              <div className="space-y-3">
                {trendingData.map((item: { tag: string; count: number }) => (
                  <div key={item.tag} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 font-bold text-lg">
                      #
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-500 transition">#{item.tag}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{`${formatNumber(item.count)} ${t('home.posts')}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('home.noTrending')}</p>
            )}
          </div>

          {/* Suggested Users */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">{t('home.suggestedForYou')}</h3>
              <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">See all</button>
            </div>
            {suggestedData?.length > 0 ? (
              <div className="space-y-3">
                {suggestedData.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Link href={`/profile/${u.username}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u.profilePicture ? (
                        <img src={u.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.fullName?.charAt(0)
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${u.username}`} className="font-semibold text-sm dark:text-white hover:underline truncate block">{u.fullName}</Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{u.username}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => followMutation.mutate(u.id)}>
                      {t('common.follow')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('home.noSuggestions')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
