"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Moon, Sun, ArrowLeft, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { siteName, logoUrl } = useSiteSettings();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const meData = await res.json();

      if (meData.data?.role !== 'ADMIN') {
        toast.error('Access denied. Admin privileges required.');
        logout();
        return;
      }

      toast.success('Welcome to Admin Panel!');
      router.push('/admin');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-500" />
          ) : (
            <Sun className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to site</span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 transition-colors">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-full h-full object-contain" />
              ) : (
                <Shield className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{siteName} Admin</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Sign in with admin credentials</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="admin@unihub.com"
                {...register('email')}
                error={errors.email?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in to Admin'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Restricted access. Unauthorized attempts are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
