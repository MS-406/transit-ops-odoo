import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Login } from './features/auth/Login';
import { ProtectedRoute, RoleGuard } from './components/layout/ProtectedRoute';
import { Card, CardHeader, CardContent } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Badge } from './components/ui/Badge';
import { useAuthStore } from './store/authStore';
import { VehicleList } from './features/vehicles/VehicleList';
import { VehicleDetail } from './features/vehicles/VehicleDetail';
import { DriverList } from './features/drivers/DriverList';
import { DriverDetail } from './features/drivers/DriverDetail';
import { TripBoard } from './features/trips/TripBoard';
import { MaintenanceList } from './features/maintenance/MaintenanceList';
import { FuelExpensesList } from './features/fuel-expenses/FuelExpensesList';
import { Dashboard } from './features/dashboard/Dashboard';
import { Reports } from './features/reports/Reports';
import { AuditLogs } from './features/audit-logs/AuditLogs';
import {
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Plus,
  Loader2
} from 'lucide-react';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Common breadcrumbs helper for placeholder pages
const PageHeader = ({ title, category = 'Platform' }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div className="text-left">
      <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
        {category} / {title}
      </span>
      <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">
        {title}
      </h2>
    </div>
  </div>
);

// Dashboard features loaded from features/dashboard/

// Driver components are loaded from features/drivers/

// Trip board loaded from features/trips/

// Maintenance logs features loaded from features/maintenance/

// Fuel & Expenses features loaded from features/fuel-expenses/

// Reports features loaded from features/reports/

// Placeholder: Settings
const SettingsPage = () => {
  const { user } = useAuthStore();
  return (
    <div className="text-left">
      <PageHeader title="Settings" category="Administration" />
      <Card className="max-w-xl">
        <CardHeader>
          <h4 className="font-extrabold text-xs uppercase text-gray-500 tracking-wider">User Account Profile</h4>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-xs">
          <div>
            <strong className="text-gray-500 uppercase tracking-wide text-[10px]">Active Name</strong>
            <p className="text-sm font-bold text-uber-black mt-1">{user?.full_name || user?.name || 'Operator'}</p>
          </div>
          <div>
            <strong className="text-gray-500 uppercase tracking-wide text-[10px]">Email Address</strong>
            <p className="text-sm font-semibold text-uber-black mt-1">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <strong className="text-gray-500 uppercase tracking-wide text-[10px]">Access Level</strong>
            <div className="mt-1">
              <Badge status="success">{user?.role_name || user?.role || 'Guest'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function App() {
  const { isInitialized, refreshSession } = useAuthStore();

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Loading screen during initial cookie validation checks
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-uber-white font-sans">
        <Loader2 size={36} className="animate-spin text-uber-black" />
        <span className="text-xs font-extrabold uppercase tracking-widest text-gray-400 mt-4 select-none">
          Transit<span className="text-uber-green">Ops</span> — Restoring Session...
        </span>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Toast notifications handler */}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

        <Routes>
          {/* Authentication View */}
          <Route path="/login" element={<Login />} />

          {/* Access Controlled Shell Routes */}
          <Route element={<ProtectedRoute />}>
            
            {/* Dashboard and Settings (All roles authorized) */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/audit-logs" element={<AuditLogs />} />

            {/* Vehicles (Read-only for others, CRUD role checks are custom) */}
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />

            {/* Drivers, Trips, and Maintenance (Accessible to Fleet Manager, Safety Officer, and Drivers) */}
            <Route element={<RoleGuard allowedRoles={['Fleet Manager', 'Safety Officer', 'Driver', 'Admin']} />}>
              <Route path="/drivers" element={<DriverList />} />
              <Route path="/drivers/:id" element={<DriverDetail />} />
              <Route path="/trips" element={<TripBoard />} />
              <Route path="/trips/new" element={<Navigate to="/trips" replace />} />
              <Route path="/trips/:id" element={<Navigate to="/trips" replace />} />
              <Route path="/maintenance" element={<MaintenanceList />} />
            </Route>

            {/* Fuel expenses and Reports (Accessible to Fleet Manager and Financial Analyst only) */}
            <Route element={<RoleGuard allowedRoles={['Fleet Manager', 'Financial Analyst', 'Admin']} />}>
              <Route path="/fuel-expenses" element={<FuelExpensesList />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

          </Route>

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
