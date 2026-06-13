"use client";
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Post } from '../types';
import { formatNumber } from '../utils';
import { Button } from '../components/ui/Button';
import { UserListModal } from '../components/ui/UserListModal';
import { Settings, Share2, Grid3X3, Bookmark, ShoppingBag, Heart } from 'lucide-react';
import { useTranslation } from '../i18n';

type Tab = 'posts' | 'products' | 'saved' | 'likes';

export function ProfilePage() {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [userListModal, setUserListModal] = useState<'followers' | 'following' | null>(null);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await api.get(`/users/${username}`);
      return data.data;
    },
  });

  const { data: userPosts } = useQuery({
    queryKey: ['profilePosts', profileData?.id],
    queryFn: async () => {
      if (!profileData?.id) return [];
      const { data } = await api.get(`/posts/feed?authorId=${profileData.id}`);
      return data.data.posts;
    },
    enabled: activeTab === 'posts' && !!profileData?.id,
  });

  const { data: userListings } = useQuery({
    queryKey: ['profileListings', profileData?.id],
    queryFn: async () => {
      if (!profileData?.id) return [];
      const { data } = await api.get(`/marketplace?sellerId=${profileData.id}`);
      return data.data.items;
    },
    enabled: activeTab === 'products' && !!profileData?.id,
  });

  const { data: savedPosts } = useQuery({
    queryKey: ['profileSavedPosts', profileData?.id],
    queryFn: async () => {
      if (!profileData?.id) return [];
      const { data } = await api.get('/posts/saved');
      return data.data;
    },
    enabled: activeTab === 'saved' && !!profileData?.id,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/users/${userId}/follow`);
      return data.data;
    },
    onMutate: async (_userId) => {
      await queryClient.cancelQueries({ queryKey: ['profile', username] });
      const previousProfile = queryClient.getQueryData(['profile', username]);
      queryClient.setQueryData(['profile', username], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          isFollowing: !old.isFollowing,
          _count: {
            ...old._count,
            followers: old.isFollowing ? old._count.followers - 1 : old._count.followers + 1,
          },
        };
      });
      return { previousProfile };
    },
    onError: (_err, _userId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile', username], context.previousProfile);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
  });

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="px-4 -mt-12">
              <div className="w-28 h-28 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-900" />
              <div className="mt-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          </div>
        ) : profileData && (
          <>
            {/* Cover Photo */}
            <div
              className={`h-40 rounded-2xl relative ${
                profileData.coverPhoto
                  ? ''
                  : profileData.coverGradient?.startsWith('custom:')
                    ? ''
                    : `bg-gradient-to-r ${profileData.coverGradient || 'from-blue-500 via-purple-500 to-pink-500'}`
              }`}
              style={
                !profileData.coverPhoto && profileData.coverGradient?.startsWith('custom:')
                  ? (() => {
                      const parts = profileData.coverGradient.split(':');
                      return { background: `linear-gradient(to right, ${parts[1]}, ${parts[2]})` };
                    })()
                  : undefined
              }
            >
              {profileData.coverPhoto && (
                <img src={profileData.coverPhoto} alt="" className="w-full h-full object-cover rounded-2xl" />
              )}
              {isOwnProfile && (
                <Link href="/edit-profile" className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition">
                  <Settings className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Profile Info */}
            <div className="px-4 -mt-16 relative z-10">
              <div className="flex items-end justify-between">
                <div className="w-28 h-28 rounded-full bg-white dark:bg-gray-900 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-white dark:border-gray-900 overflow-hidden">
                    {profileData.profilePicture ? (
                      <img src={profileData.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      profileData.fullName?.charAt(0)
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  {isOwnProfile ? (
                    <>
                      <Link href="/edit-profile">
                        <Button variant="outline" size="sm">{t('profile.editProfile')}</Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant={profileData.isFollowing ? 'secondary' : 'default'}
                        size="sm"
                        onClick={() => followMutation.mutate(profileData.id)}
                      >
                        {profileData.isFollowing ? t('common.following') : t('common.follow')}
                      </Button>
                      <Link href="/messages">
                        <Button variant="outline" size="sm">{t('profile.message')}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold dark:text-white">{profileData.fullName}</h1>
                  {profileData.isVerified && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{profileData.username}</p>
                {profileData.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{profileData.bio}</p>
                )}
                {(profileData.department || profileData.level) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {profileData.department}{profileData.level && ` · Level ${profileData.level}`}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 sm:gap-8 mt-4">
                <div className="text-center">
                  <p className="font-bold text-lg dark:text-white">{formatNumber(profileData._count?.posts || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.posts')}</p>
                </div>
                <button
                  onClick={() => setUserListModal('followers')}
                  className="text-center hover:opacity-80 transition"
                >
                  <p className="font-bold text-lg dark:text-white">{formatNumber(profileData._count?.followers || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.followers')}</p>
                </button>
                <button
                  onClick={() => setUserListModal('following')}
                  className="text-center hover:opacity-80 transition"
                >
                  <p className="font-bold text-lg dark:text-white">{formatNumber(profileData._count?.following || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('profile.following')}</p>
                </button>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="mt-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex gap-0">
                {([
                  { key: 'posts', icon: Grid3X3, label: t('profile.posts') },
                  { key: 'products', icon: ShoppingBag, label: t('profile.products') },
                  { key: 'saved', icon: Bookmark, label: t('profile.saved') },
                  { key: 'likes', icon: Heart, label: t('profile.likes') },
                ] as const).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-3 text-xs sm:text-sm font-medium border-b-2 transition ${
                      activeTab === key
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4 pb-20 md:pb-4">
              {activeTab === 'posts' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {userPosts?.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">{t('profile.noPosts')}</p>
                  ) : (
                    userPosts?.map((post: Post) => (
                      <Link
                        key={post.id}
                        href={`/post/${post.id}`}
                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition group"
                      >
                        {post.images?.[0] ? (
                          <div className="aspect-square overflow-hidden">
                            <img src={post.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300 text-center line-clamp-4">{post.content}</p>
                          </div>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'products' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {userListings?.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">{t('profile.noProducts')}</p>
                  ) : (
                    userListings?.map((item: any) => (
                      <Link
                        key={item.id}
                        href={`/marketplace/${item.id}`}
                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition group"
                      >
                        {item.images?.[0] ? (
                          <div className="aspect-square overflow-hidden">
                            <img src={item.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                            <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="font-semibold text-xs truncate dark:text-white">{item.title}</p>
                          <p className="text-blue-600 dark:text-blue-400 font-bold text-xs mt-0.5">GH₵{item.price?.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

            {activeTab === 'saved' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {savedPosts?.length === 0 ? (
                  <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">{t('profile.noSavedPosts')}</p>
                ) : (
                  savedPosts?.map((post: any) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition"
                    >
                      {post.images?.[0] ? (
                        <div className="aspect-square overflow-hidden">
                          <img src={post.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
                          <p className="text-sm text-gray-600 dark:text-gray-300 text-center line-clamp-4">{post.content}</p>
                        </div>
                      )}
                    </Link>
                  ))
                )}
              </div>
            )}

            {activeTab === 'likes' && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-12">Liked posts coming soon</p>
              )}
            </div>
          </>
        )}
      </div>

      <UserListModal
        isOpen={userListModal === 'followers'}
        onClose={() => setUserListModal(null)}
        title="Followers"
        type="followers"
        username={username}
      />
      <UserListModal
        isOpen={userListModal === 'following'}
        onClose={() => setUserListModal(null)}
        title="Following"
        type="following"
        username={username}
      />
    </div>
  );
}
