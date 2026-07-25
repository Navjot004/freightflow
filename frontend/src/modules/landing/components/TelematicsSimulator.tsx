import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, ShieldCheck, DollarSign, FileCheck, 
  MapPin, Lock, Sparkles
} from 'lucide-react';

export const TelematicsSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gps' | 'margin' | 'privacy' | 'pod'>('gps');
  
  // Simulated telemetry state
  const [telemetry, setTelemetry] = useState({
    speed: 64,
    lat: 41.8781,
    lng: -87.6298,
    progress: 42,
    hosHours: 8,
    hosMinutes: 34,
    locationName: "I-90 Eastbound nr. Gary, IN",
    nextFacility: "Logistics Hub B - Dock #12"
  });

  // Simulated live GPS updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const nextProgress = prev.progress >= 98 ? 10 : prev.progress + 1;
        const nextSpeed = 60 + Math.floor(Math.random() * 8);
        return {
          ...prev,
          speed: nextSpeed,
          progress: nextProgress,
          lat: prev.lat + 0.0012,
          lng: prev.lng + 0.0018
        };
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Margin Calculator interactive state
  const [shipperRate, setShipperRate] = useState(2500);
  const [brokerPayRate, setBrokerPayRate] = useState(2000);
  const [carrierPartnerRate, setCarrierPartnerRate] = useState(1800);

  const brokerMargin = shipperRate - brokerPayRate;
  const brokerMarginPct = ((brokerMargin / shipperRate) * 100).toFixed(1);
  const carrierMargin = brokerPayRate - carrierPartnerRate;
  const carrierMarginPct = ((carrierMargin / brokerPayRate) * 100).toFixed(1);

  // Privacy Toggle State
  const [maskingEnabled, setMaskingEnabled] = useState(true);

  return (
    <div className="w-full bg-slate-950/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Simulator Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="w-3 h-3 rounded-full bg-emerald-500 block animate-ping absolute" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Live Telematics Simulation Engine
          </span>
        </div>

        {/* Simulator Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('gps')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'gps'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>GPS Tracking</span>
          </button>

          <button
            onClick={() => setActiveTab('margin')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'margin'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Margin Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Masking</span>
          </button>

          <button
            onClick={() => setActiveTab('pod')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'pod'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>POD Hub</span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="pt-6 relative z-10 min-h-[340px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: GPS TRACKING & TELEMATICS */}
          {activeTab === 'gps' && (
            <motion.div
              key="gps"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Route Map Graphic Simulator */}
              <div className="relative w-full h-44 bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center p-4">
                {/* SVG Animated Route Line */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M 40 120 Q 200 20 400 90 T 750 40"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 40 120 Q 200 20 400 90 T 750 40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                  />
                </svg>

                {/* Origin Facility Pin */}
                <div className="absolute left-8 bottom-6 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    PU
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 mt-1">Chicago, IL</span>
                </div>

                {/* Moving Truck Icon on Route */}
                <motion.div
                  className="absolute z-20 flex flex-col items-center"
                  animate={{
                    left: `${telemetry.progress}%`,
                    top: `${45 + Math.sin(telemetry.progress / 10) * 15}%`
                  }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  <div className="relative bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/50 border border-blue-400 flex items-center gap-1.5">
                    <span className="text-sm">🚛</span>
                    <span className="text-[10px] font-bold font-mono">{telemetry.speed} MPH</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping mt-1" />
                </motion.div>

                {/* Destination Facility Pin */}
                <div className="absolute right-8 top-6 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-400 font-bold text-xs">
                    DEL
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 mt-1">Dallas, TX</span>
                </div>

                {/* Live Position Info Overlay */}
                <div className="absolute bottom-3 right-4 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{telemetry.locationName}</span>
                </div>
              </div>

              {/* Live Telematics Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Live Speed</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">{telemetry.speed} MPH</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Trip Completion</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-emerald-400 font-mono">{telemetry.progress}%</span>
                    <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${telemetry.progress}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">HOS Shift Clock</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    {telemetry.hosHours}h {telemetry.hosMinutes}m
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-400 text-[11px] block">Coordinates</span>
                  <span className="text-xs font-bold text-slate-300 font-mono block truncate mt-1">
                    {telemetry.lat.toFixed(4)}, {telemetry.lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: MULTI-TIER MARGIN ENGINE */}
          {activeTab === 'margin' && (
            <motion.div
              key="margin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Interactive Multi-Tier Freight Rate Simulator
                  </h4>
                  <p className="text-xs text-slate-400">Adjust Shipper contract rate to simulate real-time margin breakdown.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Gross Margin</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ${shipperRate - carrierPartnerRate} (${(((shipperRate - carrierPartnerRate) / shipperRate) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Interactive Rate Slider */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Shipper Contract Rate: ${shipperRate}</span>
                  <span className="text-blue-400">Drag to Test</span>
                </div>
                <input
                  type="range"
                  min="1500"
                  max="4000"
                  step="50"
                  value={shipperRate}
                  onChange={e => {
                    const rate = Number(e.target.value);
                    setShipperRate(rate);
                    setBrokerPayRate(Math.round(rate * 0.8));
                    setCarrierPartnerRate(Math.round(rate * 0.72));
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* 3-Tier Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {/* Tier 1: Shipper */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-2">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">Tier 1: Shipper Rate</span>
                  <span className="text-2xl font-black text-white font-mono block">${shipperRate}</span>
                  <p className="text-[11px] text-slate-400">Paid by Shipper to Broker</p>
                </div>

                {/* Tier 2: Broker Buy Rate */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2 relative">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Tier 2: Carrier Pay Rate</span>
                  <span className="text-2xl font-black text-white font-mono block">${brokerPayRate}</span>
                  <div className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
                    Broker Margin: ${brokerMargin} ({brokerMarginPct}%)
                  </div>
                </div>

                {/* Tier 3: Subcontractor Rate */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-2">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">Tier 3: Partner Rate</span>
                  <span className="text-2xl font-black text-white font-mono block">${carrierPartnerRate}</span>
                  <div className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block">
                    Carrier Margin: ${carrierMargin} ({carrierMarginPct}%)
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: PRIVACY MASKING */}
          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    1-Hop Disintermediation & Corporate Privacy Engine
                  </h4>
                  <p className="text-xs text-slate-400">Protects broker relationships by masking shipper corporate data from carriers.</p>
                </div>
                <button
                  onClick={() => setMaskingEnabled(!maskingEnabled)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    maskingEnabled
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{maskingEnabled ? 'Shield Active' : 'Shield Off'}</span>
                </button>
              </div>

              {/* Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Unmasked Data View (Shipper / Broker view) */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <span className="font-bold text-slate-300 block text-xs pb-2 border-b border-slate-800">
                    👑 Shipper / Broker Internal View (Unmasked)
                  </span>
                  <div className="space-y-2 font-mono">
                    <div><span className="text-slate-500">Shipper Name:</span> <span className="text-white font-bold">Acme Global Manufacturing Corp</span></div>
                    <div><span className="text-slate-500">Shipper Contact:</span> <span className="text-white">john.smith@acme.com | (555) 019-2834</span></div>
                    <div><span className="text-slate-500">Contract Rate:</span> <span className="text-emerald-400 font-bold">$2,500.00</span></div>
                  </div>
                </div>

                {/* Masked Data View (Carrier / Driver View) */}
                <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
                  maskingEnabled 
                    ? 'bg-purple-950/20 border-purple-500/40 shadow-lg shadow-purple-500/10' 
                    : 'bg-slate-900/60 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-purple-300 block text-xs">
                      🚚 Carrier / Driver View ({maskingEnabled ? '1-Hop Masked' : 'Exposed'})
                    </span>
                    {maskingEnabled && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Protected
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-slate-500">Shipper Name:</span>{' '}
                      <span className={maskingEnabled ? "text-purple-300 font-bold" : "text-white"}>
                        {maskingEnabled ? "Client (via Apex Logistics)" : "Acme Global Manufacturing Corp"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Shipper Contact:</span>{' '}
                      <span className={maskingEnabled ? "text-slate-400 italic" : "text-white"}>
                        {maskingEnabled ? "protected@freightflow.com" : "john.smith@acme.com"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Exposed Rate:</span>{' '}
                      <span className="text-blue-400 font-bold">$2,000.00 (Shipper rate hidden)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: INSTANT POD HUB */}
          {activeTab === 'pod' && (
            <motion.div
              key="pod"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    Instant Proof of Delivery (POD) & Instant Verification
                  </h4>
                  <p className="text-xs text-slate-400">Driver captures photo at dock ➔ Shipper verifies with 1 click.</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                  Instant Payout Trigger
                </span>
              </div>

              {/* POD Simulation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Driver Upload Preview */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <span className="font-bold text-amber-400 block text-xs">📸 Step 1: Driver Mobile POD Upload</span>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                        PDF
                      </div>
                      <div>
                        <span className="font-bold text-white block">BOL_POD_Signed_9832.pdf</span>
                        <span className="text-[11px] text-slate-400">Captured at 02:45 PM | Dock #14 Signature</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      POD_UPLOADED
                    </span>
                  </div>
                </div>

                {/* Shipper Verification Preview */}
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                  <span className="font-bold text-emerald-400 block text-xs">✅ Step 2: Shipper 1-Click Approval</span>
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">POD Status Verified</span>
                      <span className="text-[11px] text-emerald-400">Auto-Generates Invoice & Unlocks Settlement</span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      COMPLETED
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
