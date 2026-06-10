"use client";

import { ForgotPasswordPage } from '@/screens/ForgotPasswordPage';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicRoute } from '@/components/layout/RouteProtection';

export default function Page() {
  return (
    <PublicRoute>
      <AuthLayout>
        <ForgotPasswordPage />
      </AuthLayout>
    </PublicRoute>
  );
}
