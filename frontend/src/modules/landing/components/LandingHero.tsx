import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Radio } from 'lucide-react';
import { TelematicsSimulator } from './TelematicsSimulator';

export const LandingHero: React.FC = () => {

  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-slate-950">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-blue-600/30 via-indigo-500/20 to-emerald-400/20 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Animated Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b20_1px,transparent_1px),linear-gradient(to_bottom,#1e293b20_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Feature Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-blue-500/30 shadow-lg shadow-blue-500/10 backdrop-blur-md text-xs font-bold text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Multi-Tier Margins & 1-Hop Partner Masking Platform</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </motion.div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]"
          >
            Next-Gen Freight Execution &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              Live Telematics
            </span>
          </motion.h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Connect Shippers, Brokers, Carriers, and Drivers in one unified ecosystem. Lock in 3-tier margins, protect client privacy, and automate GPS navigation.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/signup"
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#telematics"
              className="px-6 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-800 transition-all flex items-center gap-2"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Explore Live Telematics</span>
            </a>
          </div>

          {/* Trust Badges Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> FMCSA ELD Compliant</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-400" /> 1-Hop Partner Privacy Shield</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-purple-400" /> Neon PostgreSQL Cloud</span>
          </div>
        </div>

        {/* Live Interactive Telematics Simulator Embedded */}
        <div id="telematics" className="mt-16">
          <TelematicsSimulator />
        </div>

      </div>
    </section>
  );
};
