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

// Placeholder: Dashboard
const DashboardPage = () => {
  const { user } = useAuthStore();
  return (
    <div className="animate-fade-in text-left">
      <PageHeader title="Dashboard" category="Analytics" />
      
      {/* Dark KPI Banner Section */}
      <div className="bg-uber-black text-uber-white rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-uber-gray-900">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-uber-green font-extrabold">Active Session Overview</span>
          <h3 className="text-2xl font-bold mt-1">Welcome back, {user?.name || 'Operator'}</h3>
          <p className="text-gray-400 text-xs mt-1">Fleet Operations running smoothly. 2 alerts require safety review.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="success" size="sm">Dispatch Trip</Button>
          <Button variant="secondary" size="sm" className="bg-uber-gray-900 border-none text-uber-white hover:bg-uber-gray-900/80">View Alerts</Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <span className="text-[10px] uppercase font-bold text-gray-400">Total Active Vehicles</span>
          <div className="text-3xl font-extrabold mt-1">32 / 40</div>
          <div className="text-[10px] text-uber-green font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
            <TrendingUp size={12} /> 80% Utilization rate
          </div>
        </Card>
        <Card>
          <span className="text-[10px] uppercase font-bold text-gray-400">Active Dispatches</span>
          <div className="text-3xl font-extrabold mt-1">14 Trips</div>
          <div className="text-[10px] text-uber-blue font-bold uppercase tracking-wider mt-2">
            6 in-transit | 8 planned
          </div>
        </Card>
        <Card>
          <span className="text-[10px] uppercase font-bold text-gray-400">Vehicles in Shop</span>
          <div className="text-3xl font-extrabold mt-1 text-uber-amber">4</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">
            2 scheduled for release today
          </div>
        </Card>
        <Card>
          <span className="text-[10px] uppercase font-bold text-gray-400">Compliance score</span>
          <div className="text-3xl font-extrabold mt-1 text-uber-green">98.4%</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-2">
            Excellent driver performance
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h4 className="font-extrabold uppercase text-xs tracking-wider text-gray-500">Live Dispatched Routes Overview</h4>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
            [Interactive Route Map Simulator will render here in Phase 5]
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h4 className="font-extrabold uppercase text-xs tracking-wider text-gray-500">Recent Operational Logs</h4>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-uber-gray-300 text-xs">
              <li className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-uber-black">Scania R450 entered maintenance</p>
                  <p className="text-[10px] text-gray-400">Odometer: 142,500 km</p>
                </div>
                <Badge status="maintenance">In Shop</Badge>
              </li>
              <li className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-uber-black">Trip #TR-872 dispatched</p>
                  <p className="text-[10px] text-gray-400">Cargo: Electronics (12 tons)</p>
                </div>
                <Badge status="dispatched">On Trip</Badge>
              </li>
              <li className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-uber-black">Driver John Doe Safety Flag</p>
                  <p className="text-[10px] text-gray-400">Hard braking recorded near Hub A</p>
                </div>
                <Badge status="suspended">Alert</Badge>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Placeholder: Drivers
const DriversPage = () => (
  <div className="text-left">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">Registry / Drivers</span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">Drivers</h2>
      </div>
      <Button variant="primary" size="sm" className="flex items-center gap-2">
        <Plus size={16} /> Add Driver
      </Button>
    </div>
    
    <Card>
      <CardHeader>
        <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider">Active Drivers Preview</h4>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-uber-gray-300 text-gray-400 uppercase tracking-wider font-extrabold">
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">License Class</th>
                <th className="py-3 px-4">License Expiry</th>
                <th className="py-3 px-4">Safety Score</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-uber-gray-300">
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4 font-bold text-uber-black">John Doe</td>
                <td className="py-4 px-4">Class A, CE</td>
                <td className="py-4 px-4 text-uber-green font-bold">2027-04-10 (Valid)</td>
                <td className="py-4 px-4 text-gray-600">95 / 100</td>
                <td className="py-4 px-4"><Badge status="available">Available</Badge></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4 font-bold text-uber-black">Jane Watson</td>
                <td className="py-4 px-4">Class B, C</td>
                <td className="py-4 px-4 text-uber-amber font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} /> 2026-07-25 (13 Days left)
                </td>
                <td className="py-4 px-4 text-gray-600">89 / 100</td>
                <td className="py-4 px-4"><Badge status="on trip">On Trip</Badge></td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-4 px-4 font-bold text-uber-black">Bob Johnson</td>
                <td className="py-4 px-4">Class E, F</td>
                <td className="py-4 px-4 text-uber-red font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} /> 2026-06-15 (Expired)
                </td>
                <td className="py-4 px-4 text-gray-600">76 / 100</td>
                <td className="py-4 px-4"><Badge status="suspended">Suspended</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Placeholder: Trips
const TripsPage = () => (
  <div className="text-left">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">Board / Dispatch Control</span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">Trip Board</h2>
      </div>
      <Button variant="primary" size="sm" className="flex items-center gap-2">
        <Plus size={16} /> Dispatch New Trip
      </Button>
    </div>

    {/* Kanban Columns Grid */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Draft Column */}
      <div className="bg-gray-50 border border-uber-gray-300 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-uber-gray-300">
          <span className="text-xs uppercase tracking-wider font-extrabold text-gray-500">Drafts</span>
          <Badge status="draft">2</Badge>
        </div>
        <Card className="p-4" hoverable>
          <div className="text-xs font-bold text-uber-black">TR-990 — Cargo Dry Goods</div>
          <div className="text-[10px] text-gray-500 mt-1">Route: Nairobi &rarr; Mombasa</div>
          <div className="text-[10px] text-gray-400 mt-2 font-semibold">Weight: 8.5 Tons</div>
        </Card>
      </div>

      {/* Dispatched Column */}
      <div className="bg-gray-50 border border-uber-gray-300 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-uber-gray-300">
          <span className="text-xs uppercase tracking-wider font-extrabold text-gray-500">Dispatched</span>
          <Badge status="dispatched">1</Badge>
        </div>
        <Card className="p-4 border-l-4 border-l-uber-blue" hoverable>
          <div className="text-xs font-bold text-uber-black">TR-872 — Electronics</div>
          <div className="text-[10px] text-gray-500 mt-1">Vehicle: KCD 456B</div>
          <div className="text-[10px] text-gray-400 mt-2 font-semibold">Driver: Jane Watson</div>
        </Card>
      </div>

      {/* Completed Column */}
      <div className="bg-gray-50 border border-uber-gray-300 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-uber-gray-300">
          <span className="text-xs uppercase tracking-wider font-extrabold text-gray-500">Completed</span>
          <Badge status="success">1</Badge>
        </div>
        <Card className="p-4 border-l-4 border-l-uber-green opacity-80" hoverable>
          <div className="text-xs font-bold text-uber-black">TR-712 — Wheat Cargo</div>
          <div className="text-[10px] text-gray-500 mt-1">Completed yesterday 16:30</div>
          <div className="text-[10px] text-uber-green font-bold uppercase mt-2">Delivered</div>
        </Card>
      </div>

      {/* Cancelled Column */}
      <div className="bg-gray-50 border border-uber-gray-300 rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-uber-gray-300">
          <span className="text-xs uppercase tracking-wider font-extrabold text-gray-500">Cancelled</span>
          <Badge status="retired">0</Badge>
        </div>
        <div className="text-xs text-gray-400 italic text-center py-6">No cancelled trips</div>
      </div>

    </div>
  </div>
);

// Placeholder: Maintenance
const MaintenancePage = () => (
  <div className="text-left">
    <PageHeader title="Maintenance Logs" category="Operations" />
    <Card>
      <CardHeader>
        <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider">Active Shop Records</h4>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-500">No active maintenance work orders. View resolved history logs in reports.</p>
      </CardContent>
    </Card>
  </div>
);

// Placeholder: Fuel & Expenses
const FuelExpensesPage = () => (
  <div className="text-left">
    <PageHeader title="Fuel & Expenses" category="Finance" />
    <Card>
      <CardHeader>
        <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider">Financial Transactions Ledger</h4>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gray-500">Expense logs dashboard will populate fuel consumption data from logs.</p>
      </CardContent>
    </Card>
  </div>
);

// Placeholder: Reports
const ReportsPage = () => (
  <div className="text-left">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">Analytics / Reporting</span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black uppercase">Reports & Export</h2>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <FileSpreadsheet size={16} /> Export CSV
        </Button>
        <Button variant="primary" size="sm" className="flex items-center gap-2">
          <Download size={16} /> Export PDF
        </Button>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <h4 className="text-xs uppercase font-bold text-gray-400">Total Fleet Cost rollup</h4>
        <div className="text-4xl font-extrabold text-uber-black mt-2">$24,500.00</div>
        <p className="text-xs text-gray-400 mt-2">Aggregated from Fuel logs + maintenance transactions</p>
      </Card>
      <Card>
        <h4 className="text-xs uppercase font-bold text-gray-400">Fleet Fuel efficiency</h4>
        <div className="text-4xl font-extrabold text-uber-blue mt-2">6.2 km/L</div>
        <p className="text-xs text-gray-400 mt-2">Average efficiency calculated across active route logs</p>
      </Card>
    </div>
  </div>
);

// Placeholder: Settings
const SettingsPage = () => (
  <div className="text-left">
    <PageHeader title="Settings" category="Administration" />
    <Card className="max-w-xl">
      <CardHeader>
        <h4 className="font-extrabold text-xs uppercase text-gray-500 tracking-wider">User Account Profile</h4>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-xs">
        <div>
          <strong className="text-gray-500 uppercase tracking-wide text-[10px]">Active Name</strong>
          <p className="text-sm font-bold text-uber-black mt-1">Vedant Mandalka</p>
        </div>
        <div>
          <strong className="text-gray-500 uppercase tracking-wide text-[10px]">Email Address</strong>
          <p className="text-sm font-semibold text-uber-black mt-1">admin@transitops.com</p>
        </div>
        <div>
          <strong className="text-gray-500 uppercase tracking-wide text-[10px]">Access Level</strong>
          <div className="mt-1"><Badge status="success">Fleet Manager</Badge></div>
        </div>
      </CardContent>
    </Card>
  </div>
);

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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Vehicles (Read-only for others, CRUD role checks are custom) */}
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />

            {/* Drivers, Trips, and Maintenance (Accessible to Fleet Manager, Safety Officer, and Drivers) */}
            <Route element={<RoleGuard allowedRoles={['Fleet Manager', 'Safety Officer', 'Driver']} />}>
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/drivers/:id" element={<div className="text-left">Driver Detail Page</div>} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/trips/new" element={<div className="text-left">Create Trip Form</div>} />
              <Route path="/trips/:id" element={<div className="text-left">Trip Detail View</div>} />
              <Route path="/maintenance" element={<MaintenancePage />} />
            </Route>

            {/* Fuel expenses and Reports (Accessible to Fleet Manager and Financial Analyst only) */}
            <Route element={<RoleGuard allowedRoles={['Fleet Manager', 'Financial Analyst']} />}>
              <Route path="/fuel-expenses" element={<FuelExpensesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
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
