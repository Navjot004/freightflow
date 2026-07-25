import React, { useEffect } from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { LandingHero } from '../components/LandingHero';
import { StatsMetrics } from '../components/StatsMetrics';
import { RoleMatrixSection } from '../components/RoleMatrixSection';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { LandingFooter } from '../components/LandingFooter';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = "FreightFlow — Next-Gen Freight Management & Telematics Platform";
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <LandingNavbar />

      {/* Hero Section & Live Telematics Simulator */}
      <LandingHero />

      {/* Metrics Bar */}
      <StatsMetrics />

      {/* Role Ecosystem Matrix (Shipper, Broker, Carrier, Driver, Owner-Op) */}
      <RoleMatrixSection />

      {/* Feature Showcase Grid */}
      <FeatureShowcase />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
