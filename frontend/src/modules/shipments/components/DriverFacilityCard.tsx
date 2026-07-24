import React from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { MapPin, Calendar, Phone, User, AlertTriangle, Navigation, Building2 } from 'lucide-react';

interface FacilityData {
  address?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  contactPerson?: string;
  contactNumber?: string;
  dockNumber?: string;
  referenceNumber?: string;
  specialInstructions?: string;
}

interface DriverFacilityCardProps {
  type: 'pickup' | 'delivery';
  data: FacilityData;
  isActiveLeg?: boolean;
}

export const DriverFacilityCard: React.FC<DriverFacilityCardProps> = ({
  type,
  data,
  isActiveLeg = false
}) => {
  const isPickup = type === 'pickup';
  const title = isPickup ? 'Pickup Facility (Origin)' : 'Delivery Facility (Destination)';

  const handleOpenNav = () => {
    if (!data.address) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`, '_blank');
  };

  const handleCall = () => {
    if (!data.contactNumber) return;
    window.location.href = `tel:${data.contactNumber.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <Card className={`rounded-2xl transition-all duration-300 ${
      isActiveLeg
        ? 'ring-2 ring-primary shadow-md bg-card'
        : 'bg-card/80 border-border/80'
    }`}>
      <CardContent className="p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isPickup ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-base text-foreground">{title}</h4>
              {isActiveLeg && (
                <span className="text-[11px] font-semibold text-primary">Active Stop</span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenNav}
            disabled={!data.address}
            className="rounded-xl h-9 text-xs gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-primary" />
            Nav
          </Button>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2.5">
          <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isPickup ? 'text-emerald-500' : 'text-rose-500'}`} />
          <div className="text-sm font-semibold text-foreground leading-snug">
            {data.address || 'Address not specified'}
          </div>
        </div>

        {/* Dock & Reference Number Box (High Visibility for Check-in) */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/60 rounded-xl border">
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Dock / Bay #</span>
            <span className="text-base font-bold text-foreground tracking-wide">{data.dockNumber || 'Standard'}</span>
          </div>
          <div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Ref / PU #</span>
            <span className="text-base font-bold text-primary tracking-wide">{data.referenceNumber || 'N/A'}</span>
          </div>
        </div>

        {/* Appointment Time & Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <span className="block font-medium text-foreground">
                {data.appointmentDate ? new Date(data.appointmentDate).toLocaleDateString() : 'No Appt Date'}
              </span>
              <span className="text-[11px]">{data.appointmentTime || 'FCFS / Open'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2 truncate pr-1">
              <User className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="truncate">
                <span className="block font-medium text-foreground truncate">{data.contactPerson || 'Facility Manager'}</span>
                <span className="text-[11px] truncate">{data.contactNumber || 'No phone'}</span>
              </div>
            </div>

            {data.contactNumber && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCall}
                className="h-8 w-8 rounded-full shrink-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                <Phone className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Special Instructions Callout */}
        {data.specialInstructions && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Special Facility Instructions:</span>
              <span>{data.specialInstructions}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
