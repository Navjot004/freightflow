import React from 'react';
import { Button } from '../../../components/ui/button';
import { Navigation, Phone, Clock, MapPin, ArrowRight, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DriverHeroCardProps {
  shipment: any;
  nextAction: { next: string; label: string } | null;
  onExecuteAction: (nextStatus: string) => void;
  onOpenPodModal: () => void;
  onOpenDisputeModal?: () => void;
  isTracking: boolean;
  onToggleTracking?: () => void;
}

export const DriverHeroCard: React.FC<DriverHeroCardProps> = ({
  shipment,
  nextAction,
  onExecuteAction,
  onOpenPodModal,
  onOpenDisputeModal,
  isTracking
}) => {
  const status = shipment?.status;
  const load = shipment?.load;

  // Determine current active target address & contact phone
  const isPickupPhase = ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKUP_STARTED'].includes(status);
  const targetAddress = isPickupPhase ? load?.origin_address : load?.destination_address;
  const targetContactPhone = isPickupPhase ? load?.pickup_contact_number : load?.delivery_contact_number;
  const targetAppointmentTime = isPickupPhase ? load?.pickup_appointment_time : load?.delivery_appointment_time;

  const handleOpenNavigation = () => {
    if (!targetAddress) return;
    const encodedAddress = encodeURIComponent(targetAddress);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const handleCallContact = () => {
    if (!targetContactPhone) return;
    window.location.href = `tel:${targetContactPhone.replace(/[^0-9+]/g, '')}`;
  };

  // Get current stage title & subtitle
  const getStageHeader = () => {
    switch (status) {
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return {
          title: 'New Trip Assigned',
          subtitle: 'Head to pickup facility to begin load execution.',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200'
        };
      case 'PICKUP_STARTED':
        return {
          title: 'En Route to Pickup Facility',
          subtitle: `Destination: ${load?.origin_address || 'Origin'}`,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200'
        };
      case 'PICKUP_COMPLETED':
        return {
          title: 'Cargo Loaded & Ready',
          subtitle: 'Confirm details and start main transit route.',
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200'
        };
      case 'IN_TRANSIT':
        return {
          title: 'In Transit to Destination',
          subtitle: `En route to: ${load?.destination_address || 'Destination'}`,
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200'
        };
      case 'DELIVERED':
        return {
          title: 'Delivered at Receiver',
          subtitle: 'Please capture & upload Proof of Delivery (POD).',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
        };
      case 'POD_UPLOADED':
        return {
          title: 'POD Uploaded — Pending Verification',
          subtitle: 'Proof of Delivery submitted. Awaiting Shipper / Broker verification.',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      case 'COMPLETED':
        return {
          title: 'Shipment Verified & Completed',
          subtitle: 'POD approved & verified by Shipper. Ready for payout.',
          badgeColor: 'bg-emerald-600 text-white'
        };
      default:
        return {
          title: 'Shipment Details',
          subtitle: 'Manage trip execution.',
          badgeColor: 'bg-gray-500/10 text-gray-600'
        };
    }
  };

  const stageHeader = getStageHeader();

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${stageHeader.badgeColor}`}>
            {stageHeader.title}
          </span>
          {isTracking && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              GPS Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>ETA: {shipment?.eta ? new Date(shipment.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not set'}</span>
        </div>
      </div>

      {/* Main Focus / Subtitle */}
      <p className="text-slate-300 text-sm mb-5 font-normal">
        {stageHeader.subtitle}
      </p>

      {/* Primary Action Call-To-Action Button */}
      {nextAction && (
        <div className="mb-6">
          <Button
            onClick={() => {
              if (nextAction.next === 'POD_UPLOAD') {
                onOpenPodModal();
              } else {
                onExecuteAction(nextAction.next);
              }
            }}
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 transition-transform active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {nextAction.next === 'POD_UPLOAD' ? (
              <Camera className="w-6 h-6" />
            ) : (
              <ArrowRight className="w-6 h-6" />
            )}
            {nextAction.label}
          </Button>
        </div>
      )}

      {status === 'DISPUTED' ? (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl space-y-3 text-red-300">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <div className="font-semibold text-sm">POD Rejected / Shipment Disputed</div>
              <div className="text-xs text-red-300/80">The Shipper rejected the uploaded Proof of Delivery or raised a dispute. Please select an action below:</div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-red-500/20">
            <Button
              onClick={onOpenPodModal}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-11 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" /> Re-upload POD
            </Button>
            <Button
              onClick={onOpenDisputeModal}
              variant="outline"
              className="w-full border-red-400/40 text-red-300 hover:bg-red-500/20 font-bold text-xs rounded-xl h-11 flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> Raise Dispute
            </Button>
          </div>
        </div>
      ) : status === 'POD_UPLOADED' ? (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3 text-amber-300">
          <Clock className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <div className="font-semibold text-sm">POD Submitted — Awaiting Verification</div>
            <div className="text-xs text-amber-300/80">Your Proof of Delivery has been submitted and is currently pending review & verification by the shipper/broker.</div>
          </div>
        </div>
      ) : status === 'COMPLETED' ? (
        <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-300">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-sm">Shipment Complete & Verified</div>
            <div className="text-xs text-emerald-300/80">Proof of Delivery has been approved and verified by the shipper.</div>
          </div>
        </div>
      ) : null}

      {/* Quick Action Toolbar (1-Tap Nav & Call) */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleOpenNavigation}
          disabled={!targetAddress}
          variant="outline"
          className="h-12 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span className="truncate">Open Navigation</span>
        </Button>

        <Button
          onClick={handleCallContact}
          disabled={!targetContactPhone}
          variant="outline"
          className="h-12 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4 text-blue-400" />
          <span className="truncate">{targetContactPhone ? 'Call Contact' : 'No Contact Phone'}</span>
        </Button>
      </div>

      {/* Target Appointment Info Pill */}
      {targetAddress && (
        <div className="mt-4 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate pr-2">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate font-medium">{targetAddress}</span>
          </div>
          {targetAppointmentTime && (
            <div className="shrink-0 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold text-slate-200">
              Appt: {targetAppointmentTime}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
