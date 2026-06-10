"use client";

import { SignupPage } from '@/screens/SignupPage';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicRoute } from '@/components/layout/RouteProtection';

export default function Page() {
  return (
    <PublicRoute>
      <AuthLayout>
        <SignupPage />
      </AuthLayout>
    </PublicRoute>
  );
}
