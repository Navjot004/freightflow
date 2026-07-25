import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white font-mono">FreightFlow</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise TMS and telematics ecosystem connecting Shippers, Brokers, Carriers, and Drivers with 1-hop privacy masking.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>FMCSA ELD & SOC2 Certified</span>
            </div>
          </div>

          {/* Column 2: Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Portals & Roles</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/signup?type=SHIPPER" className="hover:text-blue-400 transition-colors flex items-center gap-1">Shipper Workspace <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/signup?type=BROKER" className="hover:text-blue-400 transition-colors flex items-center gap-1">Broker Margin Portal <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/signup?type=CARRIER" className="hover:text-blue-400 transition-colors flex items-center gap-1">Carrier Fleet Directory <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors flex items-center gap-1">Driver Execution Companion <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/signup?type=OWNER_OPERATOR" className="hover:text-blue-400 transition-colors flex items-center gap-1">Owner Operator Portal <ArrowUpRight className="w-3 h-3" /></Link></li>
            </ul>
          </div>

          {/* Column 3: Telematics & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Telematics & Features</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#telematics" className="hover:text-blue-400 transition-colors">OSRM Dynamic Leg Routing</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">3-Tier Broker Margin Engine</a></li>
              <li><a href="#privacy" className="hover:text-blue-400 transition-colors">1-Hop Privacy Shield</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">HOS ELD Duty Clocks</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Instant Camera POD Verification</a></li>
            </ul>
          </div>

          {/* Column 4: Status & Quick Launch */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">System Status</h4>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">WebSocket Telematics</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                <span>Active Neon PostgreSQL</span>
                <span className="text-slate-300 font-mono">neondb_cloud</span>
              </div>
            </div>
            <Link
              to="/signup"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 text-center block transition-all"
            >
              Get Started Now
            </Link>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} FreightFlow Logistics Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">FMCSA ELD Terms</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
