import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shell } from './Shell';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to dashboard or access denied page if the user doesn't have the required role
    return <Navigate to="/dashboard" replace />;
  }

  // Render content wrapped in standard Shell layout
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
};
