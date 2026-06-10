"use client";

import { LoginPage } from '@/screens/LoginPage';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { PublicRoute } from '@/components/layout/RouteProtection';

export default function Page() {
  return (
    <PublicRoute>
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    </PublicRoute>
  );
}
