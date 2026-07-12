import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { driversApi } from '../../api/drivers';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DriverForm } from './DriverForm';
import { useAuthStore } from '../../store/authStore';
import { parseISO, differenceInDays } from 'date-fns';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  AlertTriangle,
  User,
  ShieldCheck,
  TrendingUp,
  History,
  Loader2
} from 'lucide-react';

export const DriverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Safety Officer & Fleet Manager have write access
  const isAuthorized = currentUser?.role === 'Fleet Manager' || currentUser?.role === 'Safety Officer' || currentUser?.role === 'Admin';

  // Query details
  const { data: driver, isLoading, error } = useQuery({
    queryKey: ['driver', id],
    queryFn: () => driversApi.getDriver(id),
    select: (res) => res.data
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="animate-spin text-uber-black" size={32} />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="text-left py-12">
        <Button variant="secondary" onClick={() => navigate('/drivers')} className="mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Drivers
        </Button>
        <Card className="border-uber-red/30 bg-red-50/50">
          <div className="flex items-center gap-3 text-uber-red">
            <AlertTriangle size={24} />
            <div>
              <h3 className="font-bold">Error loading driver profile</h3>
              <p className="text-xs text-red-700 mt-1">
                {error?.message || 'Driver profile not found.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // License expiry validation check (using baseline date 2026-07-12 as current server date)
  const today = parseISO('2026-07-12');
  const expiryDate = parseISO(driver.license_expiry);
  const daysToExpiry = differenceInDays(expiryDate, today);

  let expiryStatus = 'valid'; // valid, warning, expired
  if (daysToExpiry < 0) {
    expiryStatus = 'expired';
  } else if (daysToExpiry <= 30) {
    expiryStatus = 'warning';
  }

  return (
    <div className="text-left animate-fade-in">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/drivers')}
            className="p-2 hover:bg-uber-gray-300/40 rounded-full transition-colors text-uber-black"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-gray-500">
              Registry / Driver Profile
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-uber-black">
              {driver.name}
            </h2>
          </div>
        </div>

        {isAuthorized && (
          <Button
            variant="secondary"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit2 size={14} /> Edit Profile
          </Button>
        )}
      </div>

      {/* Warning/Alert banners for license verification */}
      {expiryStatus === 'expired' && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-uber-red/20 flex items-start gap-3">
          <AlertTriangle className="text-uber-red shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-uber-red uppercase">License Expired</h4>
            <p className="text-xs text-red-700 mt-1">
              This driver's license expired on {driver.license_expiry}. In compliance with fleet regulations, this profile has been flagged and excluded from trip dispatches.
            </p>
          </div>
        </div>
      )}

      {expiryStatus === 'warning' && (
        <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-uber-amber/20 flex items-start gap-3">
          <AlertTriangle className="text-uber-amber shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-800 uppercase">License Nearing Expiry</h4>
            <p className="text-xs text-amber-700 mt-1">
              This driver's license expires on {driver.license_expiry} ({daysToExpiry} days remaining). Please schedule renewal verification to prevent driver suspension.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <User size={16} /> Driver Info
            </h3>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Duty Status</span>
              <span className="text-right">
                <Badge status={driver.status}>{driver.status}</Badge>
              </span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">License Category</span>
              <span className="font-bold text-uber-black text-right">{driver.license_class}</span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">License Expiry</span>
              <span className={`text-right font-bold 
                ${expiryStatus === 'expired' ? 'text-uber-red' : ''}
                ${expiryStatus === 'warning' ? 'text-uber-amber' : 'text-uber-black'}
              `}>
                {driver.license_expiry}
              </span>
            </div>
            <div className="grid grid-cols-2 py-2 border-b border-uber-gray-300">
              <span className="text-gray-400 font-medium">Safety Rating</span>
              <span className={`font-extrabold text-right flex items-center justify-end gap-1.5
                ${driver.safety_score >= 4.5 ? 'bg-green-100 text-green-700' : ''}
                ${driver.safety_score < 4.0 ? 'bg-red-100 text-red-700' : 'bg-uber-gray-100 text-gray-700'}
              `}>
                <TrendingUp size={14} /> {Number(driver.safety_score).toFixed(1)} / 5.0
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch History Card */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2">
                <History size={16} /> Trip Dispatch History
              </h3>
            </CardHeader>
            <CardContent>
              {!driver.trip_history || driver.trip_history.length === 0 ? (
                <div className="py-12 text-center text-gray-400 italic text-xs">
                  No previous dispatch records found for this driver.
                </div>
              ) : (
                <div className="divide-y divide-uber-gray-300 text-xs">
                  {driver.trip_history.map((trip) => (
                    <div key={trip.id} className="py-4 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-uber-black uppercase block">Trip #{trip.id}</span>
                        <span className="text-[10px] text-gray-400">Route: {trip.source} &rarr; {trip.destination}</span>
                      </div>
                      <Badge status={trip.status}>{trip.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Edit Form Modal */}
      {isAuthorized && (
        <DriverForm
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          driverId={id}
        />
      )}

    </div>
  );
};
