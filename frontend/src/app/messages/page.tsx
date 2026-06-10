"use client";

import { MessagesPage } from '@/screens/MessagesPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <MessagesPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
