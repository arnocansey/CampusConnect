"use client";

import { EditProfilePage } from '@/screens/EditProfilePage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';

export default function Page() {
  return (
    <ProtectedRoute>
      <EditProfilePage />
    </ProtectedRoute>
  );
}
