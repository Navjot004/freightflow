import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShipmentAPI } from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import {
  MapPin, Upload, CheckCircle, Clock, AlertTriangle,
  FileText, Compass, Radio, ArrowLeft, RefreshCw, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { useAuthStore } from '../../../store/authStore';
import { PODUploadModal } from '../components/PODUploadModal';
import { LiveTrackingMap } from '../../../components/freight/LiveTrackingMap';
import { useLocationTracking } from '../../../hooks/useLocationTracking';
import { LocationSearchInput } from '../../../components/ui/LocationSearchInput';
import api, { toApiUrl, toWebSocketUrl } from '../../../core/api';

// New Driver-Centric & Shipper Components
import { DriverTripStepper } from '../components/DriverTripStepper';
import { DriverHeroCard } from '../components/DriverHeroCard';
import { DriverFacilityCard } from '../components/DriverFacilityCard';
import { ShipperShipmentDetailsView } from '../components/ShipperShipmentDetailsView';

export default function ShipmentExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: showToast } = useToast();
  
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'companion' | 'map' | 'documents'>('companion');
  
  const user = useAuthStore(state => state.user);
  const isDriver = user?.role?.name === 'DRIVER';
  const isOwnerOperator = user?.company?.type === 'OWNER_OPERATOR';
  const isDriverOrOwner = isDriver || isOwnerOperator;
  const canUploadPOD = isDriverOrOwner;
  
  const [currentLocation, setCurrentLocation] = useState('');
  const [eta, setEta] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isUpdatingEta, setIsUpdatingEta] = useState(false);
  
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [livePoint, setLivePoint] = useState<any>(null);
  
  const [issues, setIssues] = useState<any[]>([]);
  const [issueType, setIssueType] = useState('TRAFFIC');
  const [issueDescription, setIssueDescription] = useState('');
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  // Start tracking when status is IN_TRANSIT or PICKUP_STARTED if driver or owner operator
  const isTrackingActive = isDriverOrOwner && (shipment?.status === 'PICKUP_STARTED' || shipment?.status === 'IN_TRANSIT');
  const { isTracking, error: trackingError, startTracking, stopTracking } = useLocationTracking(id || '', isTrackingActive);

  const fetchShipment = async () => {
    try {
      const shipments = await ShipmentAPI.getMyShipments();
      const match = shipments.find((s: any) => s.id === id);
      if (match) {
        setShipment(match);
        setCurrentLocation(match.current_location || '');
        if (match.eta) {
          setEta(new Date(match.eta).toISOString().slice(0, 16));
        }
        
        // Fetch Tracking History & Issues
        try {
          const [historyRes, issuesRes] = await Promise.all([
            api.get(`/shipments/${match.id}/tracking`),
            ShipmentAPI.getIssues(match.id)
          ]);
          setTrackingHistory(historyRes.data);
          setIssues(issuesRes);
        } catch (e) {
          console.error("Failed to load tracking history or issues", e);
        }
      } else {
        showToast('Shipment not found', 'error');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load shipment', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const ws = new WebSocket(toWebSocketUrl(`/shipment/${id}`));
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'TRACKING_UPDATE') {
           setLivePoint(payload.data);
           setTrackingHistory(prev => [...prev, payload.data]);
        }
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    if (!id) return;
    try {
      await ShipmentAPI.updateStatus(id, status);
      showToast('Status updated to ' + status.replace(/_/g, ' '), 'success');
      fetchShipment();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update status', 'error');
    }
  };

  const handleUpdateLocation = async () => {
    if (!id) return;
    try {
      await ShipmentAPI.updateLocation(id, currentLocation);
      showToast('Location updated', 'success');
      fetchShipment();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update location', 'error');
    }
  };

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        
        let locName = '';
        if (data.address) {
          const city = data.address.city || data.address.town || data.address.village;
          const state = data.address.state;
          locName = [city, state].filter(Boolean).join(', ');
        }
        
        if (locName) {
          setCurrentLocation(locName);
          showToast(`Location found: ${locName}`, 'success');
        } else {
          setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch (err) {
        showToast('Failed to reverse geocode location', 'error');
      } finally {
        setLocationLoading(false);
      }
    }, (error) => {
      setLocationLoading(false);
      showToast(error.message || 'Failed to get location', 'error');
    });
  };

  const handleUpdateEta = async (customEtaIso?: string, reason?: string) => {
    if (!id) return;
    const targetEta = customEtaIso || (eta ? new Date(eta).toISOString() : null);
    if (!targetEta) {
      showToast('Please select a valid ETA date/time', 'error');
      return;
    }
    setIsUpdatingEta(true);
    try {
      await ShipmentAPI.updateETA(id, targetEta, reason || delayReason);
      showToast('ETA updated successfully', 'success');
      setDelayReason('');
      fetchShipment();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update ETA', 'error');
    } fontally: {
      setIsUpdatingEta(false);
    }
  };

  // Quick ETA Preset buttons (+15m, +30m, +1h, +2h)
  const handleQuickEtaPreset = (minutesToAdd: number) => {
    const baseDate = shipment?.eta ? new Date(shipment.eta) : new Date();
    const newEta = new Date(baseDate.getTime() + minutesToAdd * 60 * 1000);
    setEta(newEta.toISOString().slice(0, 16));
    handleUpdateEta(newEta.toISOString(), `Delayed by +${minutesToAdd} mins`);
  };

  const handleReportIssue = async () => {
    if (!id) return;
    if (!issueDescription.trim()) {
      showToast('Please provide a description for the issue', 'error');
      return;
    }
    setIsReportingIssue(true);
    try {
      await ShipmentAPI.reportIssue(id, issueType, issueDescription);
      showToast('Issue reported to dispatch successfully', 'success');
      setIssueDescription('');
      fetchShipment();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to report issue', 'error');
    } finally {
      setIsReportingIssue(false);
    }
  };

  const handleQuickIssuePill = (type: string, defaultDesc: string) => {
    setIssueType(type);
    setIssueDescription(defaultDesc);
  };

  if (loading) return (
    <div className="space-y-4 max-w-4xl mx-auto p-4">
      <Skeleton className="h-12 w-1/3 rounded-xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-[220px] w-full rounded-3xl" />
      <Skeleton className="h-[300px] w-full rounded-2xl" />
    </div>
  );

  if (!shipment) return <div className="p-6 text-center text-muted-foreground">Shipment not found.</div>;

  const nextAction = getNextStatusAction(shipment.status, !!shipment.pod_url);
  const load = shipment.load;

  if (!isDriverOrOwner) {
    return (
      <ShipperShipmentDetailsView
        shipment={shipment}
        trackingHistory={trackingHistory}
        livePoint={livePoint}
        issues={issues}
        onRefresh={fetchShipment}
      />
    );
  }

  const isPickupPhase = ['DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'PICKUP_STARTED'].includes(shipment.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 px-2 sm:px-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">ID: {shipment.id.slice(0, 8)}</span>
          <StatusBadge status={shipment.status} />
        </div>
      </div>

      {/* 1. Driver Trip Progress Stepper */}
      <DriverTripStepper status={shipment.status} />

      {/* 2. Hero Action Card (Primary focus for Driver) */}
      <DriverHeroCard
        shipment={shipment}
        nextAction={nextAction}
        onExecuteAction={handleUpdateStatus}
        onOpenPodModal={() => setIsPodModalOpen(true)}
        isTracking={isTracking}
        onToggleTracking={isTracking ? stopTracking : startTracking}
      />

      {/* 3. Mobile View Tab Bar Navigation */}
      <div className="flex bg-muted/70 p-1.5 rounded-2xl gap-1 border">
        <button
          onClick={() => setActiveTab('companion')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'companion'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Compass className="w-4 h-4 text-primary" />
          <span>Trip Companion</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'map'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-500" />
          <span>Live Map & GPS</span>
          {isTracking && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>Docs & POD</span>
          {shipment.pod_url && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        </button>
      </div>

      {/* TAB 1: TRIP COMPANION */}
      {activeTab === 'companion' && (
        <div className="space-y-6">
          {/* Facility Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DriverFacilityCard
              type="pickup"
              isActiveLeg={isPickupPhase}
              data={{
                address: load?.origin_address,
                appointmentDate: load?.pickup_appointment_date,
                appointmentTime: load?.pickup_appointment_time,
                contactPerson: load?.pickup_contact_person,
                contactNumber: load?.pickup_contact_number,
                dockNumber: load?.pickup_dock_number,
                referenceNumber: load?.pickup_reference_number,
                specialInstructions: load?.pickup_special_instructions
              }}
            />

            <DriverFacilityCard
              type="delivery"
              isActiveLeg={!isPickupPhase}
              data={{
                address: load?.destination_address,
                appointmentDate: load?.delivery_appointment_date,
                appointmentTime: load?.delivery_appointment_time,
                contactPerson: load?.delivery_contact_person,
                contactNumber: load?.delivery_contact_number,
                dockNumber: load?.delivery_dock_number,
                referenceNumber: load?.delivery_reference_number,
                specialInstructions: load?.delivery_special_instructions
              }}
            />
          </div>

          {/* Quick ETA & Location Tools for Driver / Owner Operator */}
          {isDriverOrOwner && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick ETA Tool */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> Update ETA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {/* Preset 1-Tap Buttons */}
                  <div>
                    <span className="text-muted-foreground block mb-2 font-medium">Quick Delay Presets:</span>
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleQuickEtaPreset(15)} className="rounded-xl text-xs h-9">
                        +15m
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickEtaPreset(30)} className="rounded-xl text-xs h-9">
                        +30m
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickEtaPreset(60)} className="rounded-xl text-xs h-9">
                        +1h
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleQuickEtaPreset(120)} className="rounded-xl text-xs h-9">
                        +2h
                      </Button>
                    </div>
                  </div>

                  {/* Custom ETA Selector */}
                  <div className="space-y-2 pt-2 border-t">
                    <span className="text-muted-foreground block font-medium">Exact Arrival Time:</span>
                    <Input type="datetime-local" value={eta} onChange={e => setEta(e.target.value)} className="rounded-xl text-xs" />
                    <Input value={delayReason} onChange={e => setDelayReason(e.target.value)} placeholder="Reason for delay (Optional)" className="rounded-xl text-xs" />
                    <Button variant="secondary" onClick={() => handleUpdateEta()} disabled={isUpdatingEta} className="w-full rounded-xl text-xs font-semibold h-10">
                      {isUpdatingEta ? 'Saving ETA...' : 'Save Custom ETA'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Location Update Tool */}
              <Card className="rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" /> Location & Tracking
                    </span>
                    {isTrackingActive && (
                      <Button
                        size="sm"
                        variant={isTracking ? "destructive" : "default"}
                        onClick={isTracking ? stopTracking : startTracking}
                        className="rounded-xl text-xs h-8"
                      >
                        {isTracking ? 'Pause Tracking' : 'Start GPS'}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {trackingError && <p className="text-red-500">{trackingError}</p>}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Manual Check-in Location:</span>
                    <Button variant="outline" size="sm" onClick={handleAutoLocate} disabled={locationLoading} className="rounded-xl text-xs h-8 gap-1">
                      <RefreshCw className={`w-3 h-3 ${locationLoading ? 'animate-spin' : ''}`} />
                      Auto-Locate
                    </Button>
                  </div>

                  <LocationSearchInput value={currentLocation} onChange={(val) => setCurrentLocation(val)} placeholder="e.g. Dallas, TX or I-35 Mile 140" />

                  <Button variant="secondary" onClick={handleUpdateLocation} className="w-full rounded-xl text-xs font-semibold h-10">
                    Save Manual Location
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Incident & Issue Reporter */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" /> Report Transit Delay / Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Quick Pill Selection */}
              <div>
                <span className="text-muted-foreground block mb-2 font-medium">1-Tap Common Incidents:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '🚦 Traffic Congestion', type: 'TRAFFIC', desc: 'Heavy traffic delay on highway' },
                    { label: '🔧 Vehicle Breakdown', type: 'BREAKDOWN', desc: 'Mechanical breakdown encountered' },
                    { label: '🌧️ Weather Delay', type: 'WEATHER', desc: 'Severe weather condition causing slowdown' },
                    { label: '⏳ Detention at Dock', type: 'OTHER', desc: 'Extended detention at facility dock' },
                    { label: '💥 Highway Accident', type: 'ACCIDENT', desc: 'Road blocked due to accident ahead' }
                  ].map(pill => (
                    <button
                      key={pill.type + pill.label}
                      type="button"
                      onClick={() => handleQuickIssuePill(pill.type, pill.desc)}
                      className={`px-3 py-2 rounded-xl border font-semibold transition-all ${
                        issueType === pill.type && issueDescription === pill.desc
                          ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                          : 'bg-muted/50 hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium"
                  value={issueType}
                  onChange={e => setIssueType(e.target.value)}
                >
                  <option value="TRAFFIC">Traffic Delay</option>
                  <option value="BREAKDOWN">Vehicle Breakdown</option>
                  <option value="WEATHER">Weather Delay</option>
                  <option value="ACCIDENT">Accident</option>
                  <option value="OTHER">Other / Gate Delay</option>
                </select>

                <Input
                  value={issueDescription}
                  onChange={e => setIssueDescription(e.target.value)}
                  placeholder="Additional details for dispatch..."
                  className="sm:col-span-2 rounded-xl text-xs"
                />
              </div>

              <Button
                variant="outline"
                onClick={handleReportIssue}
                disabled={isReportingIssue}
                className="w-full text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-300 rounded-xl h-10 text-xs font-bold"
              >
                {isReportingIssue ? 'Sending Report...' : 'Submit Incident Report to Dispatch'}
              </Button>

              {/* Reported Issues List */}
              {issues.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <span className="font-bold text-foreground block">Previous Incident Reports:</span>
                  <div className="space-y-2">
                    {issues.map(issue => (
                      <div key={issue.id} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <div className="flex justify-between items-center font-bold text-amber-800 dark:text-amber-300">
                          <span>{issue.issue_type}</span>
                          <span className="text-[10px] font-normal text-muted-foreground">{new Date(issue.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-1">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: LIVE MAP & ROUTE */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" /> Real-time GPS & Tracking Map
              </CardTitle>
              <Button size="sm" variant="outline" onClick={handleAutoLocate} disabled={locationLoading} className="rounded-xl text-xs gap-1">
                <RefreshCw className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} /> Recalibrate
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-2xl overflow-hidden shadow-inner" style={{ height: '520px' }}>
                <LiveTrackingMap
                  history={trackingHistory}
                  livePoint={livePoint}
                  shipmentStatus={shipment.status}
                  originAddress={shipment.load?.origin_address}
                  destinationAddress={shipment.load?.destination_address}
                  currentLocationString={currentLocation}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: DOCUMENTS & PROOF OF DELIVERY */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Shipment Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bill of Lading */}
              <div className="flex items-center justify-between p-4 border rounded-2xl bg-card">
                <div>
                  <div className="font-bold text-sm text-foreground">Bill of Lading (BOL)</div>
                  <div className="text-xs text-muted-foreground">Generated freight manifest and instructions</div>
                </div>
                {shipment.bol_url ? (
                  <div className="flex items-center gap-2">
                    <a href={toApiUrl(shipment.bol_url)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">View</Button>
                    </a>
                    <a href={toApiUrl(shipment.bol_url)} download target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">Download</Button>
                    </a>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Pending BOL</span>
                )}
              </div>

              {/* Proof of Delivery (POD) */}
              <div className="flex items-center justify-between p-4 border rounded-2xl bg-card">
                <div>
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    Proof of Delivery (POD)
                    {shipment.pod_url && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <div className="text-xs text-muted-foreground">Signed delivery receipt and photo proof</div>
                </div>

                {shipment.pod_url ? (
                  <div className="flex items-center gap-2">
                    <a href={toApiUrl(shipment.pod_url)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm" className="rounded-xl text-xs">View</Button>
                    </a>
                    {canUploadPOD && shipment.status !== 'COMPLETED' && (
                      <Button variant="ghost" onClick={() => setIsPodModalOpen(true)} size="sm" className="rounded-xl text-xs">Replace</Button>
                    )}
                  </div>
                ) : (
                  <div>
                    {canUploadPOD ? (
                      <Button onClick={() => setIsPodModalOpen(true)} size="sm" className="rounded-xl text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Upload className="w-3.5 h-3.5" /> Upload POD
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not uploaded</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Bottom Action Bar for Mobile Viewports */}
      {nextAction && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t shadow-2xl z-40 sm:hidden flex items-center gap-3">
          <Button
            onClick={() => {
              if (nextAction.next === 'POD_UPLOAD') {
                setIsPodModalOpen(true);
              } else {
                handleUpdateStatus(nextAction.next);
              }
            }}
            className="w-full h-12 text-sm font-bold bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            <span>{nextAction.label}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* POD Upload Modal */}
      {id && (
        <PODUploadModal 
          isOpen={isPodModalOpen} 
          onClose={() => setIsPodModalOpen(false)} 
          shipmentId={id} 
          onUploadSuccess={() => {
            fetchShipment();
          }} 
        />
      )}
    </div>
  );
}

function getNextStatusAction(currentStatus: string, hasPOD: boolean) {
  switch (currentStatus) {
    case 'DRIVER_ASSIGNED':
    case 'DRIVER_ACCEPTED':
      return { next: 'PICKUP_STARTED', label: 'Start Pickup Trip' };
    case 'PICKUP_STARTED':
      return { next: 'PICKUP_COMPLETED', label: 'Confirm Picked Up & Loaded' };
    case 'PICKUP_COMPLETED':
      return { next: 'IN_TRANSIT', label: 'Start Main Transit' };
    case 'IN_TRANSIT': 
      return { next: 'DELIVERED', label: 'Confirm Arrived & Delivered' };
    case 'DELIVERED':
      return hasPOD ? null : { next: 'POD_UPLOAD', label: 'Upload Proof of Delivery (POD)' };
    default: 
      return null;
  }
}
