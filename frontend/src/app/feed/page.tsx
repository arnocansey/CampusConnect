"use client";

import { HomePage } from '@/screens/HomePage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <HomePage />
      </MainLayout>
    </ProtectedRoute>
  );
}
