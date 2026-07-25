import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Truck, MapPin, DollarSign, ShieldCheck, FileCheck } from 'lucide-react';

export const TelematicsSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'loads' | 'margin' | 'privacy' | 'pod'>('loads');
  const [shipperRate, setShipperRate] = useState(2500);

  const brokerPay = Math.round(shipperRate * 0.8);
  const partnerPay = Math.round(shipperRate * 0.72);
  const brokerMargin = shipperRate - brokerPay;
  const brokerMarginPct = ((brokerMargin / shipperRate) * 100).toFixed(1);

  return (
    <Card id="telematics" className="w-full border-border bg-card shadow-lg">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <CardTitle className="text-xl font-bold font-mono">FreightFlow Interactive Engine</CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Test real platform workflows: Marketplace load bidding, 3-tier margin calculation, 1-hop privacy, and POD verification.
            </CardDescription>
          </div>

          {/* Tab Controls */}
          <div className="flex flex-wrap bg-muted/60 p-1 rounded-lg border border-border text-xs gap-1">
            <button
              onClick={() => setActiveTab('loads')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'loads' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Marketplace Bidding
            </button>

            <button
              onClick={() => setActiveTab('margin')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'margin' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" /> Margin Calculator
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'privacy' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> 1-Hop Masking
            </button>

            <button
              onClick={() => setActiveTab('pod')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'pod' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" /> POD Approval
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {activeTab === 'loads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Load Marketplace Card</span>
              <StatusBadge status="POSTED" />
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-foreground">53' Dry Van — General Industrial Cargo</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ludhiana, Punjab ➔ Delhi, NCR</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${shipperRate}.00</span>
                  <span className="text-[11px] block text-muted-foreground">Offered Contract Rate</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-border">
                <div><span className="text-muted-foreground block">Weight:</span> <strong>42,000 lbs</strong></div>
                <div><span className="text-muted-foreground block">Pickup Window:</span> <strong>Tomorrow, 08:00 AM</strong></div>
                <div><span className="text-muted-foreground block">Dock Bay #:</span> <strong>Bay #04</strong></div>
                <div><span className="text-muted-foreground block">Bids Received:</span> <strong>3 Bids</strong></div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm">View Load Details</Button>
              <Button size="sm">Submit Carrier Bid</Button>
            </div>
          </div>
        )}

        {activeTab === 'margin' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">Multi-Tier Broker Margin Engine</h4>
                <p className="text-xs text-muted-foreground">Adjust Shipper contract rate to test real-time margin breakdown.</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Broker Margin</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${brokerMargin} ({brokerMarginPct}%)
                </span>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
              <div className="flex justify-between text-xs font-medium text-foreground">
                <span>Shipper Contract Rate: ${shipperRate}</span>
                <span className="text-muted-foreground">Drag slider</span>
              </div>
              <input
                type="range"
                min="1500"
                max="4000"
                step="50"
                value={shipperRate}
                onChange={e => setShipperRate(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-border bg-background space-y-1">
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block uppercase">1. Shipper Rate</span>
                <span className="text-xl font-bold font-mono block">${shipperRate}</span>
                <span className="text-muted-foreground text-[11px]">Paid by Shipper to Broker</span>
              </div>

              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block uppercase">2. Carrier Pay Rate</span>
                <span className="text-xl font-bold font-mono block">${brokerPay}</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">Margin: ${brokerMargin} ({brokerMarginPct}%)</span>
              </div>

              <div className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-500/5 space-y-1">
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 block uppercase">3. Subcontractor Rate</span>
                <span className="text-xl font-bold font-mono block">${partnerPay}</span>
                <span className="text-purple-600 dark:text-purple-400 text-[11px] font-semibold">Carrier Margin: ${brokerPay - partnerPay}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground">1-Hop Partner Masking Demonstration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="font-bold text-foreground block pb-1 border-b border-border">👑 Shipper / Broker View (Internal)</span>
                <div><span className="text-muted-foreground">Corporate Shipper:</span> <strong>Acme Global Logistics Corp</strong></div>
                <div><span className="text-muted-foreground">Direct Contact:</span> <span>john.smith@acme.com</span></div>
                <div><span className="text-muted-foreground">Contract Rate:</span> <strong className="text-emerald-600">$2,500.00</strong></div>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-purple-500/20">
                  <span className="font-bold text-purple-600 dark:text-purple-400">🚚 Carrier / Driver View (Protected)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">1-Hop Masked</span>
                </div>
                <div><span className="text-muted-foreground">Corporate Shipper:</span> <strong className="text-purple-600 dark:text-purple-300">Client (via Apex Logistics)</strong></div>
                <div><span className="text-muted-foreground">Direct Contact:</span> <span className="text-muted-foreground italic">protected@freightflow.com</span></div>
                <div><span className="text-muted-foreground">Carrier Rate:</span> <strong className="text-blue-600">$2,000.00</strong></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pod' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-foreground">POD Verification & One-Click Shipper Completion</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="font-bold text-amber-600 dark:text-amber-400 block">📸 Driver Mobile Capture</span>
                <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between">
                  <div>
                    <span className="font-bold block">BOL_POD_Signed_8932.pdf</span>
                    <span className="text-muted-foreground text-[11px]">Uploaded at 02:45 PM | Dock #04</span>
                  </div>
                  <StatusBadge status="POD_UPLOADED" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">✅ Shipper Approval</span>
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-background flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-foreground">Delivery Verified</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">Unlocks Auto-Invoicing</span>
                  </div>
                  <StatusBadge status="COMPLETED" />
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
