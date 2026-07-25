import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, ShieldCheck, Calendar, Navigation, 
  Clock, FileCheck, Zap
} from 'lucide-react';

export const FeatureShowcase: React.FC = () => {
  const features = [
    {
      icon: DollarSign,
      title: '3-Tier Broker Margin Engine',
      description: 'Define Shipper rates ($2,500), Carrier pay rates ($2,000), and Subcontractor rates ($1,800) with live gross profit margin indicators.',
      badge: 'Financial Control',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      icon: ShieldCheck,
      title: '1-Hop Disintermediation Shield',
      description: 'Automatically masks corporate Shipper identities as "Client (via Broker)" from Carriers and Drivers, preventing relationship bypass.',
      badge: 'Privacy Protected',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    },
    {
      icon: Calendar,
      title: 'Confidential Leg Appointments',
      description: 'Dedicated leg execution cards displaying all 14 appointment dates, time windows, contact managers, dock #s, and special leg instructions.',
      badge: 'Leg Execution',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      icon: Navigation,
      title: 'Dynamic OSRM Dual-Leg Routing',
      description: 'Calculates real-time OSRM driving routes from Driver Location ➔ Pickup Facility (Leg 1) and Pickup ➔ Destination (Leg 2).',
      badge: 'Live Navigation',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      icon: Clock,
      title: 'Hours of Service (HOS) ELD Engine',
      description: 'Automated 11-Hour Driving Limit, 14-Hour Shift Clock, and 70-Hour Duty Cycle tracking with rest break violation alerts.',
      badge: 'FMCSA Compliant',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    },
    {
      icon: FileCheck,
      title: '1-Click POD Verification & Payout',
      description: 'Drivers capture high-res camera PODs. Shippers review delivery proof cards and approve shipments with one click for instant settlement.',
      badge: 'Instant Settlement',
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
    }
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-slate-950">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 inline-block mb-4">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Engineered for Precision Freight & Telematics Operations
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Built from the ground up to solve financial margins, privacy protection, telematics routing, and compliance.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-slate-800 p-6 hover:border-slate-700 hover:bg-slate-900/90 transition-all group shadow-xl relative overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl border ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                  {feat.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.description}
                </p>

                {/* Bottom Highlight Line */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                    <Zap className="w-3.5 h-3.5 text-blue-400" /> Fully Automated
                  </span>
                  <span className="text-slate-500">v2.4 Telematics</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
