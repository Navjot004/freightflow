import React from 'react';
import { Check, Truck, MapPin, PackageCheck, FileCheck, Navigation } from 'lucide-react';

interface DriverTripStepperProps {
  status: string;
}

interface Step {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  statuses: string[];
}

const STEPS: Step[] = [
  {
    id: 'assigned',
    label: 'Assigned',
    sublabel: 'Ready for pickup',
    icon: Truck,
    statuses: ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKUP_STARTED', 'PICKUP_COMPLETED', 'IN_TRANSIT', 'DELIVERED', 'POD_UPLOADED', 'COMPLETED']
  },
  {
    id: 'pickup_enroute',
    label: 'Pickup Route',
    sublabel: 'Heading to origin',
    icon: Navigation,
    statuses: ['PICKUP_STARTED', 'PICKUP_COMPLETED', 'IN_TRANSIT', 'DELIVERED', 'POD_UPLOADED', 'COMPLETED']
  },
  {
    id: 'loaded',
    label: 'Loaded',
    sublabel: 'Cargo loaded',
    icon: PackageCheck,
    statuses: ['PICKUP_COMPLETED', 'IN_TRANSIT', 'DELIVERED', 'POD_UPLOADED', 'COMPLETED']
  },
  {
    id: 'in_transit',
    label: 'In Transit',
    sublabel: 'On the road',
    icon: MapPin,
    statuses: ['IN_TRANSIT', 'DELIVERED', 'POD_UPLOADED', 'COMPLETED']
  },
  {
    id: 'delivered',
    label: 'Delivered',
    sublabel: 'Unloaded at dest.',
    icon: Check,
    statuses: ['DELIVERED', 'POD_UPLOADED', 'COMPLETED']
  },
  {
    id: 'pod',
    label: status === 'COMPLETED' ? 'POD Verified' : 'POD Submitted',
    sublabel: status === 'COMPLETED' ? 'Approved & Complete' : 'Awaiting Review',
    icon: FileCheck,
    statuses: ['POD_UPLOADED', 'COMPLETED']
  }
];

export const DriverTripStepper: React.FC<DriverTripStepperProps> = ({ status }) => {
  function isCurrent(step: Step, currentStatus: string): boolean {
    if (step.id === 'assigned' && (currentStatus === 'DRIVER_ASSIGNED' || currentStatus === 'DRIVER_ACCEPTED')) return true;
    if (step.id === 'pickup_enroute' && currentStatus === 'PICKUP_STARTED') return true;
    if (step.id === 'loaded' && currentStatus === 'PICKUP_COMPLETED') return true;
    if (step.id === 'in_transit' && currentStatus === 'IN_TRANSIT') return true;
    if (step.id === 'delivered' && currentStatus === 'DELIVERED') return true;
    if (step.id === 'pod' && (currentStatus === 'POD_UPLOADED' || currentStatus === 'COMPLETED')) return true;
    return false;
  }

  const currentStepIndex = STEPS.findIndex(s => isCurrent(s, status));

  return (
    <div className="w-full bg-card border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-none gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const active = isCurrent(step, status);
          const isPassed = currentStepIndex > idx || (currentStepIndex === -1 && status === 'COMPLETED');

          return (
            <React.Fragment key={step.id}>
              {/* Connector line before step */}
              {idx > 0 && (
                <div
                  className={`h-1 flex-1 min-w-[20px] max-w-[60px] rounded-full transition-colors ${
                    isPassed || active ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}

              {/* Step item */}
              <div className="flex flex-col items-center min-w-[75px] text-center group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-bold ${
                    active
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110 shadow-lg shadow-primary/20'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isPassed ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>

                <span
                  className={`text-xs font-semibold mt-2 tracking-tight line-clamp-1 ${
                    active
                      ? 'text-primary font-bold'
                      : isPassed
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {step.sublabel}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
