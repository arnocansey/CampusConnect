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
import { useSiteSettings } from '../hooks/useSiteSettings';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
    studentId: z.string().optional(),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupPage() {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const { siteName, logoUrl } = useSiteSettings();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data);
      toast.success(t('auth.welcomeBack'));
      window.location.href = '/login';
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 lg:hidden overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="w-full h-full object-contain" />
          ) : (
            'CC'
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('auth.createAccount')}</h1>
        <p className="text-gray-500 mt-1">{t('auth.joinCampus')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.fullName')}</label>
          <Input
            placeholder={t('auth_placeholder.johnDoe')}
            {...register('fullName')}
            error={errors.fullName?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.username')}</label>
          <Input
            placeholder={t('auth_placeholder.johndoe')}
            {...register('username')}
            error={errors.username?.message}
          />
        </div>

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
            placeholder={t('auth_placeholder.createPassword')}
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('auth.confirmPassword')}
          </label>
          <Input
            type="password"
            placeholder={t('auth_placeholder.confirmYourPassword')}
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-600">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  );
}
