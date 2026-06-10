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
import { Settings, Share2, Grid3X3, Bookmark, ShoppingBag, Heart } from 'lucide-react';

type Tab = 'posts' | 'products' | 'saved' | 'likes';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('posts');

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

  const { data: userNotes } = useQuery({
    queryKey: ['profileNotes', profileData?.id],
    queryFn: async () => {
      if (!profileData?.id) return [];
      const { data } = await api.get(`/notes?uploaderId=${profileData.id}`);
      return data.data.notes;
    },
    enabled: activeTab === 'saved' && !!profileData?.id,
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/users/${userId}/follow`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
  });

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="max-w-7xl mx-auto p-4 flex gap-6">
      <div className="flex-1 max-w-3xl">
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
            <div className="h-40 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl relative">
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
            <div className="px-4 -mt-14 relative z-10">
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
                        <Button variant="outline" size="sm">Edit Profile</Button>
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
                        {profileData.isFollowing ? 'Following' : 'Follow'}
                      </Button>
                      <Link href="/messages">
                        <Button variant="outline" size="sm">Message</Button>
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
              <div className="flex gap-8 mt-4">
                <div className="text-center">
                  <p className="font-bold text-lg dark:text-white">{formatNumber(profileData._count?.posts || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg dark:text-white">{formatNumber(profileData._count?.followers || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg dark:text-white">{formatNumber(profileData._count?.following || 0)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Following</p>
                </div>
              </div>
            </div>

            {/* Profile Tabs */}
            <div className="mt-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex gap-0">
                {([
                  { key: 'posts', icon: Grid3X3, label: 'Posts' },
                  { key: 'products', icon: ShoppingBag, label: 'Products' },
                  { key: 'saved', icon: Bookmark, label: 'Saved' },
                  { key: 'likes', icon: Heart, label: 'Likes' },
                ] as const).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
                      activeTab === key
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="mt-4 pb-20 md:pb-4">
              {activeTab === 'posts' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {userPosts?.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">No posts yet</p>
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
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">No products listed</p>
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
                          <p className="text-blue-600 dark:text-blue-400 font-bold text-xs mt-0.5">₦{item.price?.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {userNotes?.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">No saved notes</p>
                  ) : (
                    userNotes?.map((note: any) => (
                      <Link
                        key={note.id}
                        href={`/notes/${note.id}`}
                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-lg transition"
                      >
                        <h3 className="font-semibold text-sm dark:text-white">{note.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note.course}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{note.downloads} downloads</p>
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
    </div>
  );
}
