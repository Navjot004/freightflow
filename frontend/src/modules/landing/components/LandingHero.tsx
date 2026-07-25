import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { TelematicsSimulator } from './TelematicsSimulator';

export const LandingHero: React.FC = () => {
  return (
    <section className="relative pt-12 pb-16 overflow-hidden bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Top Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Tier Freight Margin & Telematics Platform</span>
          </div>
        </div>

        {/* Headline & Description */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
            Autonomous Freight Execution & <span className="text-primary">Multi-Tier Margin System</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Connect Shippers, Brokers, Carriers, and Drivers. Lock in 3-tier gross profit margins, protect broker client relationships with 1-hop privacy masking, and automate POD verification.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/signup">
              <Button size="lg" className="font-bold gap-2 shadow-sm">
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <a href="#telematics">
              <Button size="lg" variant="outline" className="font-semibold gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span>Test Live Engine</span>
              </Button>
            </a>
          </div>

          {/* Compliance & Security */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> FMCSA ELD Ready</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-primary" /> 1-Hop Partner Privacy</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-purple-500" /> Neon PostgreSQL Cloud</span>
          </div>
        </div>

        {/* Interactive Engine Embedded */}
        <div className="mt-12">
          <TelematicsSimulator />
        </div>

      </div>
    </section>
  );
};
