"use client";
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, !!data.rememberMe);
      toast.success(t('auth.welcomeBack'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 lg:hidden">
          CC
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.welcomeBack')}</h1>
        <p className="text-gray-500 mt-1">{t('auth.signInSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
          <Input
            type="email"
            placeholder={t('auth_placeholder.youUniversity')}
            {...register('email')}
            error={errors.email?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
          <Input
            type="password"
            placeholder={t('auth_placeholder.enterPassword')}
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300" defaultChecked {...register('rememberMe')} />
            <span className="text-sm text-gray-600">{t('auth.rememberMe')}</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-600">
        {t('auth.dontHaveAccount')}{' '}
        <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
          {t('auth.signUp')}
        </Link>
      </p>
    </div>
  );
}
