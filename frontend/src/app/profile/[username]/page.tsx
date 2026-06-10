"use client";

import { ProfilePage } from '@/screens/ProfilePage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ProfilePage />
      </MainLayout>
    </ProtectedRoute>
  );
}
