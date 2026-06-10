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
import { ArrowLeft, Camera, Save } from 'lucide-react';
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

export function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

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

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          size="sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
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
            <p className="font-semibold">{user?.fullName}</p>
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
