import React, { useEffect } from 'react';
import { LandingNavbar } from '../components/LandingNavbar';
import { LandingHero } from '../components/LandingHero';
import { StatsMetrics } from '../components/StatsMetrics';
import { RoleMatrixSection } from '../components/RoleMatrixSection';
import { FeatureShowcase } from '../components/FeatureShowcase';
import { LandingFooter } from '../components/LandingFooter';

export const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = "FreightFlow — Telematics & TMS Platform";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Native Navbar with Light/Dark theme toggle */}
      <LandingNavbar />

      {/* Main Hero & Interactive Engine */}
      <LandingHero />

      {/* Stats Bar */}
      <StatsMetrics />

      {/* Role Workspaces */}
      <RoleMatrixSection />

      {/* Feature Capabilities Grid */}
      <FeatureShowcase />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;
