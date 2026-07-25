import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { DollarSign, ShieldCheck, Calendar, Navigation, Clock, FileCheck } from 'lucide-react';

export const FeatureShowcase: React.FC = () => {
  const features = [
    {
      icon: DollarSign,
      title: '3-Tier Broker Margin Engine',
      description: 'Define Shipper rates ($2,500), Carrier pay rates ($2,000), and Subcontractor rates ($1,800) with live margin badges.',
      badge: 'Financial Control'
    },
    {
      icon: ShieldCheck,
      title: '1-Hop Disintermediation Shield',
      description: 'Automatically masks corporate Shipper identities as "Client (via Broker)" from Carriers and Drivers.',
      badge: 'Privacy Protection'
    },
    {
      icon: Calendar,
      title: 'Confidential Facility Appointments',
      description: 'Dedicated leg execution cards displaying all 14 appointment dates, time windows, contact managers, and dock #s.',
      badge: 'Leg Execution'
    },
    {
      icon: Navigation,
      title: 'Dynamic OSRM Dual-Leg Routing',
      description: 'Calculates real-time driving routes from Driver Location ➔ Pickup Facility (Leg 1) and Pickup ➔ Destination (Leg 2).',
      badge: 'Live Navigation'
    },
    {
      icon: Clock,
      title: 'Hours of Service (HOS) ELD Engine',
      description: 'Automated 11-Hour Driving Limit, 14-Hour Shift Clock, and 70-Hour Duty Cycle tracking with break alerts.',
      badge: 'FMCSA Compliant'
    },
    {
      icon: FileCheck,
      title: 'One-Click Shipper POD Approval',
      description: 'Drivers upload mobile POD camera captures. Shippers review delivery proof and approve shipments with one click.',
      badge: 'Instant Settlement'
    }
  ];

  return (
    <section id="features" className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Platform Features & Capabilities
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Engineered to solve rate margins, corporate privacy, telematics routing, and delivery verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="border-border bg-card shadow-sm hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                      {feat.badge}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-foreground mt-3">
                    {feat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                    {feat.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};
