"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Camera, Save, Palette, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500).optional(),
  department: z.string().optional(),
  program: z.string().optional(),
  level: z.number().int().min(100).max(500).optional().nullable(),
  skills: z.string().optional(),
  interests: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const PRESET_GRADIENTS = [
  { name: 'Ocean', value: 'from-blue-500 via-purple-500 to-pink-500', colors: ['#3b82f6', '#a855f7', '#ec4899'] },
  { name: 'Sunset', value: 'from-orange-400 via-red-500 to-pink-500', colors: ['#fb923c', '#ef4444', '#ec4899'] },
  { name: 'Forest', value: 'from-green-400 via-emerald-500 to-teal-500', colors: ['#4ade80', '#10b981', '#14b8a6'] },
  { name: 'Midnight', value: 'from-indigo-600 via-purple-600 to-blue-800', colors: ['#4f46e5', '#9333ea', '#1e40af'] },
  { name: 'Peach', value: 'from-amber-300 via-orange-400 to-rose-400', colors: ['#fcd34d', '#fb923c', '#fb7185'] },
  { name: 'Arctic', value: 'from-cyan-300 via-blue-400 to-indigo-500', colors: ['#67e8f9', '#60a5fa', '#6366f1'] },
  { name: 'Lavender', value: 'from-violet-400 via-purple-400 to-fuchsia-500', colors: ['#a78bfa', '#c084fc', '#d946ef'] },
  { name: 'Emerald', value: 'from-emerald-400 via-teal-500 to-cyan-500', colors: ['#34d399', '#14b8a6', '#06b6d4'] },
  { name: 'Coral', value: 'from-rose-400 via-pink-500 to-purple-500', colors: ['#fb7185', '#ec4899', '#a855f7'] },
  { name: 'Gold', value: 'from-yellow-400 via-amber-500 to-orange-500', colors: ['#facc15', '#f59e0b', '#f97316'] },
];

export function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverGradient, setCoverGradient] = useState(user?.coverGradient || PRESET_GRADIENTS[0].value);
  const [customColor1, setCustomColor1] = useState('#3b82f6');
  const [customColor2, setCustomColor2] = useState('#a855f7');
  const [useCustomGradient, setUseCustomGradient] = useState(false);
  const [showGradientPicker, setShowGradientPicker] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      bio: user?.bio || '',
      department: user?.department || '',
      program: user?.program || '',
      level: user?.level || null,
      skills: user?.skills?.join(', ') || '',
      interests: user?.interests?.join(', ') || '',
    },
  });

  const currentCoverStyle = coverPhoto
    ? {}
    : useCustomGradient
      ? { background: `linear-gradient(to right, ${customColor1}, ${customColor2})` }
      : {};

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const payload = {
        ...data,
        skills: data.skills
          ? data.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        interests: data.interests
          ? data.interests.split(',').map((i) => i.trim()).filter(Boolean)
          : [],
        coverGradient: useCustomGradient
          ? `custom:${customColor1}:${customColor2}`
          : coverGradient,
      };
      const { data: response } = await api.put('/users/profile/update', payload);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
      router.push(`/profile/${user?.username}`);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post('/users/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfilePicture(data.data.profilePicture);
      updateUser({ profilePicture: data.data.profilePicture });
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Failed to upload picture');
    }
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const { data } = await api.post('/users/profile/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCoverPhoto(data.data.coverPhoto);
      updateUser({ coverPhoto: data.data.coverPhoto });
      toast.success('Cover photo updated!');
    } catch {
      toast.error('Failed to upload cover photo');
    }
  };

  const handleRemoveCoverPhoto = async () => {
    try {
      await api.put('/users/profile/update', { coverGradient: null });
      setCoverPhoto(null);
      updateUser({ coverPhoto: undefined });
      toast.success('Cover photo removed');
    } catch {
      toast.error('Failed to remove cover photo');
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold dark:text-white truncate">Edit Profile</h1>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          size="sm"
          className="shrink-0"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Cover Photo */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Cover Photo</p>
        <div
          className={`relative h-40 rounded-xl overflow-hidden ${
            coverPhoto ? '' : `bg-gradient-to-r ${coverGradient}`
          }`}
          style={currentCoverStyle}
        >
          {coverPhoto && (
            <img src={coverPhoto} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition">
            <label className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition">
              <Camera className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverPhotoUpload}
              />
            </label>
            <button
              onClick={() => setShowGradientPicker(!showGradientPicker)}
              className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
            >
              <Palette className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>
            {coverPhoto && (
              <button
                onClick={handleRemoveCoverPhoto}
                className="p-3 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            )}
          </div>
        </div>

        {/* Gradient Picker */}
        {showGradientPicker && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Choose Gradient</p>
              <button
                onClick={() => setUseCustomGradient(false)}
                className={`text-xs px-2 py-1 rounded-lg transition ${
                  !useCustomGradient
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setUseCustomGradient(true)}
                className={`text-xs px-2 py-1 rounded-lg transition ${
                  useCustomGradient
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Custom
              </button>
            </div>

            {!useCustomGradient ? (
              <div className="grid grid-cols-5 sm:grid-cols-5 gap-2">
                {PRESET_GRADIENTS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setCoverGradient(preset.value)}
                    className={`relative h-12 rounded-lg bg-gradient-to-r ${preset.value} transition transform hover:scale-105 ${
                      coverGradient === preset.value ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
                    }`}
                  >
                    {coverGradient === preset.value && (
                      <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
                    )}
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                  <input
                    type="color"
                    value={customColor1}
                    onChange={(e) => setCustomColor1(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                  <input
                    type="color"
                    value={customColor2}
                    onChange={(e) => setCustomColor2(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0"
                  />
                </div>
                <div
                  className="flex-1 h-10 rounded-lg"
                  style={{ background: `linear-gradient(to right, ${customColor1}, ${customColor2})` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Picture */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
              {profilePicture || user?.profilePicture ? (
                <img
                  src={profilePicture || user?.profilePicture}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.fullName?.charAt(0)
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
              />
            </label>
          </div>
          <div>
            <p className="font-semibold dark:text-white">{user?.fullName}</p>
            <p className="text-sm text-gray-500">@{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <Input {...register('fullName')} error={errors.fullName?.message} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows={3}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
            {errors.bio && (
              <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <Input {...register('department')} placeholder="e.g. Computer Science" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Program
            </label>
            <Input {...register('program')} placeholder="e.g. BSc Software Engineering" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <Input
              type="number"
              {...register('level', { valueAsNumber: true })}
              placeholder="e.g. 300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Skills (comma separated)
            </label>
            <Input
              {...register('skills')}
              placeholder="e.g. React, Node.js, Python"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Interests (comma separated)
            </label>
            <Input
              {...register('interests')}
              placeholder="e.g. Web Dev, AI, Music"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
