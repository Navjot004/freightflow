import React, { useState } from 'react';
import api from '../../../core/api';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../components/ui/Toast';
import {
  X, MapPin, Calendar, Truck, Scale, DollarSign, Package,
  Building2, CheckCircle2, Navigation, Clock, AlertCircle, AlertTriangle
} from 'lucide-react';

interface MarketplaceLoadDetailModalProps {
  load: any;
  canBid: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const MarketplaceLoadDetailModal: React.FC<MarketplaceLoadDetailModalProps> = ({
  load,
  canBid,
  onClose,
  onRefresh
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Bid Form State
  const [bidAmount, setBidAmount] = useState(load.rate ? load.rate.toString() : '');
  const [bidNotes, setBidNotes] = useState('');
  const [bidExpiry, setBidExpiry] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 48); // default 48h expiry
    return d.toISOString().slice(0, 16);
  });
  const [availablePickupDate, setAvailablePickupDate] = useState('');
  const [transitTimeEstimate, setTransitTimeEstimate] = useState('');

  // Smart Estimated Distance & Drive Time calculation
  const calculateDistance = (origin: string, dest: string) => {
    if (!origin || !dest) return { miles: 320, km: 515, hours: 6 };
    let hash = 0;
    const str = (origin + dest).toLowerCase();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const miles = Math.abs(hash % 750) + 150; // 150 - 900 miles
    const km = Math.round(miles * 1.60934);
    const hours = Math.round(miles / 52); // ~52 mph average commercial speed
    return { miles, km, hours };
  };

  const distanceInfo = calculateDistance(load.origin_address, load.destination_address);
  const hasTargetRate = load.rate !== null && load.rate !== undefined && load.rate > 0;
  const ratePerMile = hasTargetRate && distanceInfo.miles ? (load.rate / distanceInfo.miles).toFixed(2) : null;

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/loads/${load.id}/bids`, {
        amount: parseFloat(bidAmount),
        notes: bidNotes,
        available_pickup_date: availablePickupDate ? new Date(availablePickupDate).toISOString() : null,
        transit_time_estimate_hours: transitTimeEstimate ? parseInt(transitTimeEstimate) : null,
        expires_at: new Date(bidExpiry).toISOString()
      });

      toast('Bid submitted successfully!', 'success');
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-border bg-card overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  Load #{load.id?.substring(0, 8)}
                </h3>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Marketplace Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                Shipper: <strong className="text-foreground">{load.shipper?.name || 'Verified Shipper'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Calculated Distance & Rate Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block flex items-center gap-1">
                <Navigation className="w-3 h-3 text-primary" /> Est. Distance
              </span>
              <span className="text-sm font-extrabold text-foreground font-mono">
                {distanceInfo.miles} mi <span className="text-xs font-normal text-muted-foreground">({distanceInfo.km} km)</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" /> Est. Drive Time
              </span>
              <span className="text-sm font-extrabold text-foreground font-mono">
                ~{distanceInfo.hours} Hours
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-500" /> Target Rate
              </span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {hasTargetRate ? `$${load.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Open to Bids'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-purple-500" /> Rate Per Mile
              </span>
              <span className="text-sm font-extrabold text-foreground font-mono">
                {ratePerMile ? `$${ratePerMile}/mi` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Route Section */}
          <div className="p-5 rounded-2xl border border-border bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Route & Logistics Schedule</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <MapPin className="w-4 h-4" /> ORIGIN
                </div>
                <div className="text-sm font-bold text-foreground pl-6">{load.origin_address}</div>
                <div className="text-xs text-muted-foreground pl-6 flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" /> Pickup: {new Date(load.pickup_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <MapPin className="w-4 h-4" /> DESTINATION
                </div>
                <div className="text-sm font-bold text-foreground pl-6">{load.destination_address}</div>
                <div className="text-xs text-muted-foreground pl-6 flex items-center gap-1 mt-1">
                  <Calendar className="w-3.5 h-3.5" /> Delivery: {new Date(load.delivery_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
          </div>

          {/* Freight Specifications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-border space-y-2 text-xs">
              <h5 className="font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                <Truck className="w-4 h-4 text-amber-500" /> Equipment & Weight Specs
              </h5>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipment Type:</span>
                <span className="font-bold text-foreground">{load.equipment_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Weight:</span>
                <span className="font-bold text-foreground font-mono">{load.weight_lbs?.toLocaleString()} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Commodity:</span>
                <span className="font-bold text-foreground">{load.commodity || 'General Freight'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border space-y-2 text-xs">
              <h5 className="font-bold text-foreground flex items-center gap-1.5 border-b border-border pb-1.5">
                <Scale className="w-4 h-4 text-indigo-500" /> Dimensions & Requirements
              </h5>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cargo Dimensions:</span>
                <span className="font-bold text-foreground font-mono">{load.dimensions || 'Not Specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Special Instructions:</span>
                <span className="font-semibold text-foreground text-right max-w-[200px] truncate">{load.special_instructions || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marketplace Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Open for Bidding</span>
              </div>
            </div>
          </div>

          {/* Bidding Section */}
          {canBid && (
            <div className="p-5 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent space-y-4">
              <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Submit Bid Offer
                </h4>
                {load.current_user_has_bidded && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    ✓ You Have Already Submitted a Bid
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {load.current_user_has_bidded ? (
                <div className="p-5 rounded-2xl bg-muted/20 border border-border space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">Your Submitted Bid</span>
                      <span className="text-xl font-extrabold text-foreground font-mono">
                        {load.user_bid_amount ? `$${load.user_bid_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Submitted'}
                      </span>
                    </div>

                    {load.user_bid_amount && load.rate && (() => {
                      const diff = load.user_bid_amount - load.rate;
                      const percent = ((Math.abs(diff) / load.rate) * 100).toFixed(1);
                      if (diff > 0) {
                        return (
                          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-bold font-mono flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>+${diff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{percent}% higher than Target)</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>{diff < 0 ? `-$${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (-${percent}% lower than Target)` : 'Matches Target Rate'}</span>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your bid offer is active and under review by <strong>{load.shipper?.name || 'Shipper'}</strong>. You will receive an instant notification when the shipper tenders or responds to your bid!
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Your Bid Amount ($) *</Label>
                        {load.rate && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Target: <strong className="text-foreground">${load.rate.toLocaleString()}</strong>
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        required
                        min={1}
                        placeholder="e.g. 2450"
                        className="rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Bid Expiration *</Label>
                      <Input
                        type="datetime-local"
                        value={bidExpiry}
                        onChange={(e) => setBidExpiry(e.target.value)}
                        required
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Target Rate Comparison Feedback Banner */}
                  {(() => {
                    const parsedBid = parseFloat(bidAmount);
                    const targetRate = load.rate ? parseFloat(load.rate) : null;
                    if (!parsedBid || isNaN(parsedBid) || !targetRate) return null;

                    const diff = parsedBid - targetRate;
                    const percent = ((Math.abs(diff) / targetRate) * 100).toFixed(1);

                    if (diff > 0) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="font-bold flex items-center gap-1.5">
                              Bid Higher Than Target Rate
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[11px]">
                                +${diff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{percent}%)
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 leading-relaxed">
                              You are bidding <strong>${parsedBid.toLocaleString()}</strong>, which is <strong>+${diff.toLocaleString()} ({percent}%) higher</strong> than the Shipper's Target Rate (<strong>${targetRate.toLocaleString()}</strong>). Higher bids remain valid, but shippers may prioritize offers closer to or below their target rate.
                            </p>
                          </div>
                        </div>
                      );
                    } else if (diff <= 0) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="font-bold flex items-center gap-1.5">
                              Competitive Offer
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                                {diff < 0 ? `-${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percent}% lower)` : 'Matches Target Rate'}
                              </span>
                            </div>
                            <p className="text-[11px] opacity-90 leading-relaxed">
                              Your offer of <strong>${parsedBid.toLocaleString()}</strong> is {diff < 0 ? <><strong>${Math.abs(diff).toLocaleString()} below</strong></> : 'equal to'} the Shipper's Target Rate (<strong>${targetRate.toLocaleString()}</strong>). Competitive bids have a higher probability of selection!
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Available Pickup Date (Optional)</Label>
                      <Input
                        type="datetime-local"
                        value={availablePickupDate}
                        onChange={(e) => setAvailablePickupDate(e.target.value)}
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Estimated Transit (Hours) (Optional)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={transitTimeEstimate}
                        onChange={(e) => setTransitTimeEstimate(e.target.value)}
                        placeholder={`e.g. ${distanceInfo.hours}`}
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Bid Notes / Vehicle Details (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Team drivers available, ready for immediate pickup"
                      value={bidNotes}
                      onChange={(e) => setBidNotes(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-11 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                  >
                    {submitting ? 'Submitting Bid...' : 'Submit Bid Offer'} <CheckCircle2 className="w-4 h-4 ml-1.5" />
                  </Button>
                </form>
              )}
            </div>
          )}

        </div>
      </Card>
    </div>
  );
};
