import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shell } from './Shell';

// ProtectedRoute: Verifies login state and renders the Shell layout wrapper
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render children inside layout shell
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
};

// RoleGuard: Performs granular RBAC checks on individual nested routes
export const RoleGuard = ({ allowedRoles }) => {
  const { user } = useAuthStore();

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles back to safe landing page
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
