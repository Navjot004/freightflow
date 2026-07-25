import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-muted/50 border-t border-border text-muted-foreground py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-foreground font-mono">FreightFlow</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enterprise TMS and telematics platform for Shippers, Brokers, Carriers, and Drivers.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>FMCSA ELD Ready</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Portals</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/signup?type=SHIPPER" className="hover:text-foreground transition-colors inline-flex items-center gap-1">Shipper Portal <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/signup?type=BROKER" className="hover:text-foreground transition-colors inline-flex items-center gap-1">Broker Margin Portal <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/signup?type=CARRIER" className="hover:text-foreground transition-colors inline-flex items-center gap-1">Carrier Fleet Directory <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors inline-flex items-center gap-1">Driver Companion <ArrowUpRight className="w-3 h-3" /></Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Core Capabilities</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#telematics" className="hover:text-foreground transition-colors">3-Tier Rate Margin Engine</a></li>
              <li><a href="#telematics" className="hover:text-foreground transition-colors">1-Hop Privacy Masking</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Confidential Leg Appointments</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">One-Click POD Verification</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Database & Cloud</h4>
            <div className="p-3 rounded-lg border border-border bg-card text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span>Database Stack</span>
                <strong className="text-foreground">Neon PostgreSQL</strong>
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-border">
                <span>Status</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Online
                </span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
          <p>© {new Date().getFullYear()} FreightFlow Platform. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
