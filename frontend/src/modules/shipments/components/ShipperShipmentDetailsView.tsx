import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { LiveTrackingMap } from '../../../components/freight/LiveTrackingMap';
import { toApiUrl } from '../../../core/api';
import {
  MapPin, Truck, Package, Clock, DollarSign, FileText, CheckCircle2,
  Radio, RefreshCw, ArrowLeft, Building2, Mail,
  User, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShipperShipmentDetailsViewProps {
  shipment: any;
  trackingHistory: any[];
  livePoint: any;
  issues: any[];
  onRefresh: () => void;
}

export const ShipperShipmentDetailsView: React.FC<ShipperShipmentDetailsViewProps> = ({
  shipment,
  trackingHistory,
  livePoint,
  issues,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'documents' | 'logs'>('overview');
  const load = shipment?.load || {};

  const getMilestoneIndex = (status: string) => {
    switch (status) {
      case 'DRAFT':
      case 'TENDER_ACCEPTED':
      case 'OPEN_FOR_BIDDING':
      case 'WAITING_FOR_PARTNER_ASSIGNMENT':
      case 'PARTNER_REQUESTED':
        return 0;
      case 'PARTNER_ACCEPTED':
      case 'WAITING_FOR_DRIVER_ASSIGNMENT':
      case 'DRIVER_ASSIGNED':
      case 'DRIVER_ACCEPTED':
        return 1;
      case 'PICKUP_STARTED':
      case 'PICKUP_COMPLETED':
        return 2;
      case 'IN_TRANSIT':
        return 3;
      case 'DELIVERED':
      case 'POD_UPLOADED':
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getMilestoneIndex(shipment.status);
  const steps = [
    { title: 'Tender Accepted', desc: 'Load confirmed' },
    { title: 'Carrier Assigned', desc: 'Driver dispatched' },
    { title: 'Loaded & Picked Up', desc: 'Cargo loaded at origin' },
    { title: 'In Transit', desc: 'On the road' },
    { title: 'Delivered', desc: 'POD verified' },
  ];

  const rateAmount =
    shipment.agreed_rate ??
    shipment.rate ??
    shipment.agreed_price ??
    load.agreed_rate ??
    load.rate ??
    load.target_rate ??
    0;

  const hasAssignedCarrier =
    shipment.carrier_company &&
    shipment.carrier_id !== shipment.broker_id &&
    shipment.carrier_company.type !== 'BROKER';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 px-2 sm:px-4">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                Shipment #{shipment.id.slice(0, 8)}
              </h1>
              <StatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Reference: {load.reference_number || shipment.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2 rounded-xl text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </Button>
        </div>
      </div>

      {/* Shipper Lifecycle Progress Stepper */}
      <Card className="rounded-2xl shadow-sm border p-4 sm:p-6 bg-card">
        <div className="relative">
          <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-border z-0" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
            {steps.map((step, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={idx} className="flex md:flex-col items-center gap-3 md:text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-500/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
                      {step.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Tab Navigation */}
      <div className="flex bg-muted/60 p-1.5 rounded-2xl gap-1 border">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4 text-blue-500" />
          <span>Shipment Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'tracking'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-500" />
          <span>GPS & Live Location</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>Documents & POD</span>
          {shipment.pod_url && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        </button>
      </div>

      {/* TAB 1: SHIPMENT OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Freight & Cargo Specifications */}
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Package className="w-4 h-4 text-blue-500" /> Freight & Cargo Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Route</span>
                  <div className="font-semibold text-foreground text-xs mt-0.5">
                    {load.origin_address || 'Origin N/A'} ➔ {load.destination_address || 'Destination N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Equipment Type</span>
                    <span className="font-semibold text-foreground">{load.equipment_type || 'Standard Trailer'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Commodity</span>
                    <span className="font-semibold text-foreground">{load.commodity || 'General Freight'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Weight & Volume</span>
                    <span className="font-semibold text-foreground">
                      {load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : 'N/A'}
                      {load.volume_cuft ? ` | ${load.volume_cuft} cu ft` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Dimensions</span>
                    <span className="font-semibold text-foreground font-mono">
                      {load.length_ft ? `${load.length_ft}'×${load.width_ft || 8}'×${load.height_ft || 8}'` : 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-1">
                  <span className="text-muted-foreground block text-[11px]">Special Conditions</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {load.is_hazmat ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 border border-red-500/30">
                        ⚠️ HAZMAT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                        Non-Hazmat
                      </span>
                    )}
                    {load.temp_min != null && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-600 border border-cyan-500/30">
                        ❄️ Temp: {load.temp_min}°F - {load.temp_max}°F
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Partner & Driver Assignment */}
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Truck className="w-4 h-4 text-emerald-500" /> Carrier & Dispatch Info
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                {/* Assigned Carrier */}
                <div>
                  <span className="text-muted-foreground block text-[11px]">Carrier / Logistics Provider</span>
                  {hasAssignedCarrier ? (
                    <div className="font-bold text-foreground text-sm flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      {shipment.carrier_company?.name || shipment.carrier_company?.company_name}
                    </div>
                  ) : (
                    <div className="text-amber-600 dark:text-amber-400 font-semibold italic mt-0.5">
                      Awaiting Carrier Partner Assignment
                    </div>
                  )}
                  {hasAssignedCarrier && shipment.carrier_company?.email && (
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {shipment.carrier_company.email}
                    </div>
                  )}
                </div>

                {/* Assigned Driver */}
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block text-[11px]">Assigned Driver</span>
                  {shipment.driver ? (
                    <div className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      {shipment.driver.first_name} {shipment.driver.last_name} ({shipment.driver.phone || 'No phone'})
                    </div>
                  ) : (
                    <div className="text-amber-600 dark:text-amber-400 font-medium italic mt-0.5">
                      Waiting for carrier driver assignment...
                    </div>
                  )}
                </div>

                {/* Live Position & ETA */}
                <div className="pt-2 border-t grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Current Location</span>
                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {shipment.current_location || 'At facility / Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Estimated ETA</span>
                    <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-blue-500" />
                      {shipment.eta ? new Date(shipment.eta).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'On Schedule'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Financial Summary & Actions */}
            <Card className="rounded-2xl shadow-sm border">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <DollarSign className="w-4 h-4 text-purple-500" /> Financial & Rate Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Agreed Shipment Rate</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${typeof rateAmount === 'number' ? rateAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }) : rateAmount}
                  </div>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Payment Status</span>
                    <span className="font-bold text-foreground">
                      {shipment.status === 'COMPLETED' ? 'Settled' : 'Pending POD Verification'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Rate Confirmation</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Validated
                    </span>
                  </div>
                </div>

                {issues && issues.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground block text-[11px]">Reported Incidents ({issues.length})</span>
                    <div className="mt-1 space-y-1">
                      {issues.map((issue: any) => (
                        <div key={issue.id} className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px]">
                          <span className="font-bold text-amber-700 dark:text-amber-300">{issue.issue_type}</span>: {issue.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      )}

      {/* TAB 2: LIVE GPS MAP */}
      {activeTab === 'tracking' && (
        <Card className="rounded-2xl border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500" /> Real-Time GPS Tracking Map
            </CardTitle>
            <Button size="sm" variant="outline" onClick={onRefresh} className="rounded-xl text-xs gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh GPS
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border rounded-2xl overflow-hidden shadow-inner" style={{ height: '480px' }}>
              <LiveTrackingMap
                history={trackingHistory}
                livePoint={livePoint}
                shipmentStatus={shipment.status}
                originAddress={load.origin_address}
                destinationAddress={load.destination_address}
                currentLocationString={shipment.current_location}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: DOCUMENTS & POD */}
      {activeTab === 'documents' && (
        <Card className="rounded-2xl border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" /> Shipment Documents & POD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bill of Lading */}
            <div className="flex items-center justify-between p-4 border rounded-2xl bg-card">
              <div>
                <div className="font-bold text-sm text-foreground">Bill of Lading (BOL)</div>
                <div className="text-xs text-muted-foreground">Freight manifest and delivery instructions</div>
              </div>
              {shipment.bol_url ? (
                <div className="flex items-center gap-2">
                  <a href={toApiUrl(shipment.bol_url)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="rounded-xl text-xs">View Document</Button>
                  </a>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">BOL pending generation</span>
              )}
            </div>

            {/* Proof of Delivery (POD) */}
            {(() => {
              const podUrlToDisplay = shipment.pod_url || shipment.receiver_signature_url;
              let photoList: string[] = [];
              if (shipment.delivery_photos_urls) {
                try {
                  photoList = typeof shipment.delivery_photos_urls === 'string'
                    ? JSON.parse(shipment.delivery_photos_urls)
                    : shipment.delivery_photos_urls;
                } catch (e) {}
              }

              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-2xl bg-card gap-3">
                    <div>
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        Proof of Delivery (POD)
                        {podUrlToDisplay && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground">Signed delivery receipt and photo proof</div>
                    </div>

                    {podUrlToDisplay ? (
                      <a href={toApiUrl(podUrlToDisplay)} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          View Full POD Document
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Awaiting driver upload upon delivery</span>
                    )}
                  </div>

                  {/* Inline POD Details & Signature Display for Shipper */}
                  {(podUrlToDisplay || shipment.receiver_name) && (
                    <div className="p-4 border rounded-2xl bg-muted/20 space-y-4">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        Delivery Receipt Details
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Receiver Name</span>
                          <span className="font-bold text-foreground text-sm">{shipment.receiver_name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[11px]">OS&D Status</span>
                          {shipment.osd_reported ? (
                            <span className="font-bold text-red-600 dark:text-red-400">⚠️ OS&D Reported</span>
                          ) : (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Clean Delivery</span>
                          )}
                        </div>
                      </div>

                      {shipment.delivery_notes && (
                        <div className="text-xs space-y-1">
                          <span className="text-muted-foreground block text-[11px]">Delivery Notes</span>
                          <p className="bg-background p-2.5 rounded-xl border italic text-muted-foreground">"{shipment.delivery_notes}"</p>
                        </div>
                      )}

                      {shipment.osd_notes && (
                        <div className="text-xs space-y-1">
                          <span className="text-muted-foreground block text-[11px] text-red-500">OS&D Report Notes</span>
                          <p className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20 text-red-700 dark:text-red-300">"{shipment.osd_notes}"</p>
                        </div>
                      )}

                      {shipment.receiver_signature_url && (
                        <div className="space-y-1.5">
                          <span className="text-muted-foreground block text-[11px]">Receiver Signature</span>
                          <div className="p-2 border rounded-xl bg-white w-fit max-w-xs shadow-sm">
                            <img
                              src={toApiUrl(shipment.receiver_signature_url)}
                              alt="Receiver Signature"
                              className="h-20 object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {photoList.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t">
                          <span className="text-muted-foreground block text-[11px]">Delivery Proof Photos ({photoList.length})</span>
                          <div className="flex flex-wrap gap-2">
                            {photoList.map((photoUrl, idx) => (
                              <a key={idx} href={toApiUrl(photoUrl)} target="_blank" rel="noreferrer" className="block border rounded-xl overflow-hidden hover:opacity-90">
                                <img src={toApiUrl(photoUrl)} alt={`Delivery photo ${idx + 1}`} className="w-20 h-20 object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
