import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Building2, Briefcase, Truck, UserCheck, 
  ShieldCheck, ArrowRight, CheckCircle2, Lock, Navigation, FileText, Camera
} from 'lucide-react';

export const RoleMatrixSection: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'shipper' | 'broker' | 'carrier' | 'driver' | 'owner_operator'>('broker');

  const roles = [
    {
      id: 'shipper',
      label: 'Shipper Portal',
      icon: Building2,
      badge: 'Cargo Owner',
      title: 'Autonomous Load Dispatch & Instant POD Receipts',
      description: 'Post freight loads with custom cargo requirements, receive competitive bids, monitor live telematics, and verify POD receipts with 1 click.',
      features: [
        'Custom load creation with confidential appointment windows',
        'Real-time GPS tracking & delivery ETA notifications',
        'One-click POD review, approval, & dispute initiation',
        'Automated rating & carrier quality scorecard'
      ],
      ctaText: 'Post a Load as Shipper',
      ctaLink: '/signup?type=SHIPPER',
      accentColor: 'from-blue-500 to-indigo-500',
      mockupIcon: FileText
    },
    {
      id: 'broker',
      label: 'Broker Portal',
      icon: Briefcase,
      badge: 'Margin Control',
      title: 'Multi-Tier Margin System & 1-Hop Disintermediation Shield',
      description: 'Manage load tendering, lock in multi-tier gross profit margins, and protect client relationships with automated partner privacy masking.',
      features: [
        '3-Tier Financial Margin Engine (Shipper ➔ Broker ➔ Carrier ➔ Subcontractor)',
        '1-Hop Privacy Masking: Masks corporate shipper data as "Client (via Broker)"',
        'Real-time margin calculator with live % profit badges',
        'Multi-relationship automated invoice generation'
      ],
      ctaText: 'Start Brokering Freight',
      ctaLink: '/signup?type=BROKER',
      accentColor: 'from-purple-500 to-indigo-500',
      mockupIcon: Lock
    },
    {
      id: 'carrier',
      label: 'Carrier Portal',
      icon: Truck,
      badge: 'Fleet Ops',
      title: 'Fleet Dispatcher Directory & Partner Subcontracting',
      description: 'Manage drivers, assign fleet dispatchers, monitor HOS ELD clocks, and seamlessly forward loads to trusted partner owner-operators.',
      features: [
        'Comprehensive driver directory & availability status control',
        'Searchable Fleet Manager combobox dropdown for dispatcher assignment',
        'Partner assignment forwarding with offered pay rate control',
        'Real-time fleet tracking map & HOS violation monitoring'
      ],
      ctaText: 'Register Carrier Fleet',
      ctaLink: '/signup?type=CARRIER',
      accentColor: 'from-emerald-500 to-teal-500',
      mockupIcon: Truck
    },
    {
      id: 'driver',
      label: 'Driver Portal',
      icon: UserCheck,
      badge: 'Mobile Companion',
      title: 'Dynamic OSRM Dual-Leg Navigation & Camera POD Hub',
      description: 'Mobile-first driver workspace with dynamic route pathing (Driver ➔ Pickup and Pickup ➔ Delivery), HOS duty switches, and instant camera document upload.',
      features: [
        'Dynamic Leg 1 (Origin) & Leg 2 (Destination) live OSRM navigation',
        'Interactive HOS Shift Clock & duty status switcher (DRIVING / ON_DUTY)',
        'Mobile Camera POD upload with instant status broadcast',
        '1-Tap Facility Contact dialing and Dock # check-in instructions'
      ],
      ctaText: 'Access Driver Portal',
      ctaLink: '/login',
      accentColor: 'from-amber-500 to-orange-500',
      mockupIcon: Navigation
    },
    {
      id: 'owner_operator',
      label: 'Owner Operator',
      icon: ShieldCheck,
      badge: 'Independent Trucker',
      title: 'Auto-Dispatch & Instant Payout Execution',
      description: 'Single-truck independent operator portal. Accept assignment requests from brokers or carriers with auto-dispatching and clear pay breakdown.',
      features: [
        'Instant assignment acceptance with auto self-dispatch',
        'Clear offered pay rate display ($1,800.00 Offered Pay)',
        'Integrated vehicle management & truck number tracking',
        'Direct invoice generation upon POD completion'
      ],
      ctaText: 'Join as Owner-Operator',
      ctaLink: '/signup?type=OWNER_OPERATOR',
      accentColor: 'from-rose-500 to-red-500',
      mockupIcon: Camera
    }
  ];

  const currentRole = roles.find(r => r.id === selectedRole) || roles[0];

  return (
    <section id="matrix" className="py-20 relative overflow-hidden bg-slate-950/60 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20 inline-block mb-4">
            Unified Freight Ecosystem
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Tailored Workspaces for Every Industry Role
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Switch between specialized portals. Designed for seamless collaboration with total role privacy and financial security.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = r.id === selectedRole;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id as any)}
                className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-xl border border-slate-700 ring-2 ring-blue-500/30'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* Role Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRole.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            {/* Ambient Background Gradient */}
            <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${currentRole.accentColor} opacity-10 blur-3xl pointer-events-none rounded-full`} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Column: Role Overview & Feature List */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700">
                  <currentRole.icon className="w-3.5 h-3.5 text-blue-400" />
                  <span>{currentRole.badge}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                  {currentRole.title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {currentRole.description}
                </p>

                <ul className="space-y-3 pt-2">
                  {currentRole.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <Link
                    to={currentRole.ctaLink}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all group"
                  >
                    <span>{currentRole.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Mockup Box */}
              <div className="lg:col-span-5">
                <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-4 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <currentRole.mockupIcon className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">{currentRole.label} Preview</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Portal Status</span>
                      <span className="text-emerald-400 font-bold">Active & Synced</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Role Verification</span>
                      <span className="text-blue-400 font-bold">Verified Corporate</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400">Telematics Link</span>
                      <span className="text-purple-400 font-bold">WebSocket Connected</span>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <span className="text-[11px] text-slate-500 block">
                      🔒 Protected by FreightFlow 256-bit Encryption
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
