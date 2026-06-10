"use client";

import { GroupsPage } from '@/screens/GroupsPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <GroupsPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
