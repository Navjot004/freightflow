import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import { Building2, Briefcase, Truck, UserCheck, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RoleMatrixSection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'shipper' | 'broker' | 'carrier' | 'driver' | 'owner_operator'>('broker');

  const roles = [
    {
      id: 'shipper',
      label: 'Shipper Portal',
      icon: Building2,
      badge: 'Cargo Owner',
      title: 'Autonomous Load Dispatch & One-Click POD Approval',
      description: 'Post loads, receive competitive bids, track confidential facility appointments, and verify POD receipts with 1 click.',
      features: [
        'Load creation with confidential appointment windows',
        'Real-time GPS tracking & delivery ETA notifications',
        'One-click POD review, approval, & dispute initiation',
        'Automated rating & carrier quality scorecard'
      ],
      ctaText: 'Post Load as Shipper',
      ctaLink: '/signup?type=SHIPPER'
    },
    {
      id: 'broker',
      label: 'Broker Portal',
      icon: Briefcase,
      badge: 'Margin Control',
      title: '3-Tier Financial Margin Engine & 1-Hop Partner Masking',
      description: 'Manage load tendering, lock in multi-tier gross profit margins, and protect client relationships with partner privacy masking.',
      features: [
        '3-Tier Rate Engine (Shipper ➔ Broker ➔ Carrier ➔ Subcontractor)',
        '1-Hop Privacy Masking: Masks corporate shipper data as "Client (via Broker)"',
        'Live margin calculator with offered pay rate control',
        'Multi-relationship automated invoice generation'
      ],
      ctaText: 'Start Brokering Freight',
      ctaLink: '/signup?type=BROKER'
    },
    {
      id: 'carrier',
      label: 'Carrier Portal',
      icon: Truck,
      badge: 'Fleet Operations',
      title: 'Fleet Dispatcher Directory & Subcontractor Assignment',
      description: 'Manage drivers, assign fleet dispatchers, monitor HOS ELD clocks, and forward loads to trusted partner owner-operators.',
      features: [
        'Driver directory & availability status control',
        'Fleet Manager combobox dropdown for dispatcher assignment',
        'Partner assignment forwarding with offered pay rate control',
        'Real-time fleet tracking map & HOS violation monitoring'
      ],
      ctaText: 'Register Carrier Fleet',
      ctaLink: '/signup?type=CARRIER'
    },
    {
      id: 'driver',
      label: 'Driver Portal',
      icon: UserCheck,
      badge: 'Mobile Companion',
      title: 'Dynamic Dual-Leg Navigation & Mobile Camera POD Hub',
      description: 'Mobile-first driver workspace with dynamic route pathing (Origin ➔ Pickup and Pickup ➔ Delivery), HOS duty switches, and instant document upload.',
      features: [
        'Dynamic Leg 1 (Origin) & Leg 2 (Destination) live OSRM navigation',
        'Interactive HOS Shift Clock & duty status switcher (DRIVING / ON_DUTY)',
        'Mobile Camera POD upload with instant status broadcast',
        '1-Tap Facility Contact dialing and Dock # check-in instructions'
      ],
      ctaText: 'Access Driver Companion',
      ctaLink: '/login'
    },
    {
      id: 'owner_operator',
      label: 'Owner Operator',
      icon: ShieldCheck,
      badge: 'Independent Operator',
      title: 'Auto Self-Dispatch & Instant Payout Execution',
      description: 'Single-truck independent operator portal. Accept assignment requests from brokers or carriers with auto-dispatching and clear pay breakdown.',
      features: [
        'Instant assignment acceptance with auto self-dispatch',
        'Clear offered pay rate display ($1,800.00 Offered Pay)',
        'Integrated vehicle management & truck number tracking',
        'Direct invoice generation upon POD completion'
      ],
      ctaText: 'Join as Owner-Operator',
      ctaLink: '/signup?type=OWNER_OPERATOR'
    }
  ];

  const currentRole = roles.find(r => r.id === selectedRole) || roles[0];

  return (
    <section id="portals" className="py-16 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Tailored Workspaces for Every Role
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Switch between specialized portals designed for seamless collaboration and financial privacy.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = r.id === selectedRole;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id as any)}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Role Card */}
        <Card className="border-border bg-card shadow-md">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <currentRole.icon className="w-4 h-4" />
              <span>{currentRole.badge}</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              {currentRole.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {currentRole.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentRole.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground p-3 rounded-lg border border-border bg-muted/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link to={currentRole.ctaLink}>
                <Button className="font-bold gap-2">
                  <span>{currentRole.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </section>
  );
};
