import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShipmentAPI } from '../api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Label } from '../../../components/ui/label';
import { MapPin, Navigation, Upload, CheckCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { useAuthStore } from '../../../store/authStore';
import { PODUploadModal } from '../components/PODUploadModal';
import { LiveTrackingMap } from '../../../components/freight/LiveTrackingMap';
import { useLocationTracking } from '../../../hooks/useLocationTracking';
import { LocationSearchInput } from '../../../components/ui/LocationSearchInput';
import api, { toApiUrl, toWebSocketUrl } from '../../../core/api';

export default function ShipmentExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast: showToast } = useToast();
  
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const user = useAuthStore(state => state.user);
  const isDriver = user?.role?.name === 'DRIVER';
  const isOwnerOperator = user?.company?.type === 'OWNER_OPERATOR';
  const isCarrier = user?.company?.type === 'CARRIER';
  const canUploadPOD = isDriver || isOwnerOperator;
  
  const [currentLocation, setCurrentLocation] = useState('');
  const [eta, setEta] = useState('');
  const [delayReason, setDelayReason] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  
  const [trackingHistory, setTrackingHistory] = useState<any[]>([]);
  const [livePoint, setLivePoint] = useState<any>(null);
  
  const [issues, setIssues] = useState<any[]>([]);
  const [issueType, setIssueType] = useState('OTHER');
  const [issueDescription, setIssueDescription] = useState('');

  // Start tracking when status is IN_TRANSIT or PICKUP_STARTED if driver
  const isTrackingActive = (isDriver || isOwnerOperator) && (shipment?.status === 'PICKUP_STARTED' || shipment?.status === 'IN_TRANSIT');
  const { isTracking, error: trackingError, startTracking, stopTracking } = useLocationTracking(id || '', isTrackingActive);

  const fetchShipment = async () => {
    try {
      const shipments = await ShipmentAPI.getMyShipments();
      const match = shipments.find((s: any) => s.id === id);
      if (match) {
        setShipment(match);
        setCurrentLocation(match.current_location || '');
        if (match.eta) {
          setEta(new Date(match.eta).toISOString().slice(0,16));
        }
        
        // Fetch Tracking History
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
      showToast('Status updated to ' + status, 'success');
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

  const handleUpdateEta = async () => {
    if (!id) return;
    try {
      await ShipmentAPI.updateETA(id, new Date(eta).toISOString(), delayReason);
      showToast('ETA updated', 'success');
      setDelayReason('');
      fetchShipment();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update ETA', 'error');
    }
  };

  const handleReportIssue = async () => {
    if (!id) return;
    if (!issueDescription.trim()) {
      showToast('Please provide a description', 'error');
      return;
    }
    try {
      await ShipmentAPI.reportIssue(id, issueType, issueDescription);
      showToast('Issue reported successfully', 'success');
      setIssueType('OTHER');
      setIssueDescription('');
      fetchShipment();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to report issue', 'error');
    }
  };



  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
  if (!shipment) return <div>Shipment not found.</div>;

  const nextAction = getNextStatusAction(shipment.status, !!shipment.pod_url);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          &larr; Back
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">Execute Shipment</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Shipment {shipment.id.slice(0,8)}</CardTitle>
          <div className="text-sm text-muted-foreground flex items-center space-x-2">
            <span>Status:</span>
            <StatusBadge status={shipment.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
             <div className="flex flex-col">
               <span className="text-sm font-semibold">Origin</span>
               <span>{shipment.load?.origin_address}</span>
             </div>
             <Navigation className="h-6 w-6 text-muted-foreground"/>
             <div className="flex flex-col text-right">
               <span className="text-sm font-semibold">Destination</span>
               <span>{shipment.load?.destination_address}</span>
             </div>
          </div>
          
          {nextAction && (
             <Button 
                onClick={() => {
                  if (nextAction.next === 'POD_UPLOAD') {
                    setIsPodModalOpen(true);
                  } else {
                    handleUpdateStatus(nextAction.next);
                  }
                }} 
                className="w-full h-14 text-lg"
             >
               {nextAction.label}
             </Button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(isDriver || isOwnerOperator) ? (
              <div className="space-y-4 border p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center"><MapPin className="mr-2 h-4 w-4"/> GPS Tracking</h4>
                  {isTrackingActive && (
                    <Button variant={isTracking ? "destructive" : "default"} size="sm" onClick={isTracking ? stopTracking : startTracking}>
                      {isTracking ? 'Stop Trip' : 'Start Trip'}
                    </Button>
                  )}
                </div>
                {trackingError && <p className="text-red-500 text-sm">{trackingError}</p>}
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm">Manual Update Location</h5>
                    <Button variant="outline" size="sm" onClick={handleAutoLocate} disabled={locationLoading}>
                      {locationLoading ? 'Locating...' : 'Auto-Locate'}
                    </Button>
                  </div>
                  <div className="mb-2">
                    <LocationSearchInput value={currentLocation} onChange={(val) => setCurrentLocation(val)} placeholder="e.g. Dallas, TX" />
                  </div>
                  <Button variant="secondary" className="w-full" onClick={handleUpdateLocation}>Save Manual Location</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border p-4 rounded-lg">
                <h4 className="font-semibold flex items-center"><MapPin className="mr-2 h-4 w-4"/> Current Location</h4>
                <div className="text-sm mt-2">
                  {shipment.current_location ? (
                    <div>
                      {(() => {
                        try {
                          const parsed = JSON.parse(shipment.current_location);
                          return `Lat: ${parseFloat(parsed.lat).toFixed(4)}, Lng: ${parseFloat(parsed.lng).toFixed(4)}`;
                        } catch {
                          return shipment.current_location;
                        }
                      })()}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Not reported yet</span>
                  )}
                </div>
              </div>
            )}
            
            {(isDriver || isOwnerOperator) ? (
              <div className="space-y-4 border p-4 rounded-lg">
                <h4 className="font-semibold flex items-center"><Clock className="mr-2 h-4 w-4"/> Update ETA</h4>
                <Input type="datetime-local" value={eta} onChange={e => setEta(e.target.value)} />
                <Input value={delayReason} onChange={e => setDelayReason(e.target.value)} placeholder="Delay Reason (Optional)" />
                <Button variant="secondary" className="w-full" onClick={handleUpdateEta}>Save ETA</Button>
              </div>
            ) : (
              <div className="space-y-4 border p-4 rounded-lg">
                <h4 className="font-semibold flex items-center"><Clock className="mr-2 h-4 w-4"/> ETA</h4>
                <div className="text-sm mt-2">
                  {shipment.eta ? (
                    <div>
                      {new Date(shipment.eta).toLocaleString()}
                      {shipment.delay_reason && (
                        <div className="text-red-500 text-xs mt-1">Delay: {shipment.delay_reason}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Not reported yet</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-4 border p-4 rounded-lg">
              <h4 className="font-semibold flex items-center"><AlertTriangle className="mr-2 h-4 w-4 text-orange-500"/> Report Transit Issue</h4>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={issueType} 
                onChange={e => setIssueType(e.target.value)}
              >
                <option value="BREAKDOWN">Breakdown</option>
                <option value="WEATHER">Weather Delay</option>
                <option value="TRAFFIC">Traffic</option>
                <option value="ACCIDENT">Accident</option>
                <option value="OTHER">Other</option>
              </select>
              <Input value={issueDescription} onChange={e => setIssueDescription(e.target.value)} placeholder="Description" />
              <Button variant="outline" className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200" onClick={handleReportIssue}>
                Report Issue
              </Button>
            </div>
          </div>
          
          {issues.length > 0 && (
            <div className="space-y-4 border p-4 rounded-lg bg-orange-50/50">
              <h4 className="font-semibold flex items-center text-orange-800"><AlertTriangle className="mr-2 h-4 w-4"/> Reported Issues</h4>
              <div className="space-y-3">
                {issues.map(issue => (
                  <div key={issue.id} className="bg-white p-3 rounded border border-orange-200 text-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-orange-800">{issue.issue_type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(issue.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-muted-foreground">{issue.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border rounded-lg p-1 bg-background" style={{ height: '600px' }}>
            <LiveTrackingMap history={trackingHistory} livePoint={livePoint} />
          </div>
          
          <div className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <h4 className="font-semibold flex items-center text-slate-900 dark:text-slate-100"><Calendar className="mr-2 h-4 w-4"/> Appointments</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h5 className="font-medium text-sm text-slate-500 dark:text-slate-400 border-b pb-2 uppercase tracking-wider">Pickup</h5>
                <div className="text-sm space-y-2">
                  {shipment.load?.pickup_appointment_date ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Date & Time:</span>
                        <span className="font-medium text-right">{new Date(shipment.load.pickup_appointment_date).toLocaleDateString()} {shipment.load.pickup_appointment_time || ''}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium text-right">{shipment.load.pickup_contact_person || '-'} <br className="hidden md:block"/> {shipment.load.pickup_contact_number ? `(${shipment.load.pickup_contact_number})` : ''}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Dock / Ref:</span>
                        <span className="font-medium text-right">{shipment.load.pickup_dock_number || '-'} <br className="hidden md:block"/> {shipment.load.pickup_reference_number ? `/ ${shipment.load.pickup_reference_number}` : ''}</span>
                      </div>
                      {shipment.load.pickup_special_instructions && (
                        <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-2 rounded border border-yellow-200 dark:border-yellow-800/50">
                          <span className="font-semibold block mb-1">Instructions:</span> {shipment.load.pickup_special_instructions}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">No pickup appointment set</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <h5 className="font-medium text-sm text-slate-500 dark:text-slate-400 border-b pb-2 uppercase tracking-wider">Delivery</h5>
                <div className="text-sm space-y-2">
                  {shipment.load?.delivery_appointment_date ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Date & Time:</span>
                        <span className="font-medium text-right">{new Date(shipment.load.delivery_appointment_date).toLocaleDateString()} {shipment.load.delivery_appointment_time || ''}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium text-right">{shipment.load.delivery_contact_person || '-'} <br className="hidden md:block"/> {shipment.load.delivery_contact_number ? `(${shipment.load.delivery_contact_number})` : ''}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Dock / Ref:</span>
                        <span className="font-medium text-right">{shipment.load.delivery_dock_number || '-'} <br className="hidden md:block"/> {shipment.load.delivery_reference_number ? `/ ${shipment.load.delivery_reference_number}` : ''}</span>
                      </div>
                      {shipment.load.delivery_special_instructions && (
                        <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-2 rounded border border-yellow-200 dark:border-yellow-800/50">
                          <span className="font-semibold block mb-1">Instructions:</span> {shipment.load.delivery_special_instructions}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">No delivery appointment set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 border p-4 rounded-lg">
            <h4 className="font-semibold flex items-center"><Upload className="mr-2 h-4 w-4"/> Documents</h4>
            
            <div className="flex justify-between items-center p-3 border rounded bg-background">
              <span className="font-medium">Bill of Lading (BOL)</span>
              {shipment.bol_url ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">Generated</span>
                  <a href={toApiUrl(shipment.bol_url)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">View</Button>
                  </a>
                  <a href={toApiUrl(shipment.bol_url)} download target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">Download</Button>
                  </a>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Pending</span>
              )}
            </div>

            <div className="flex justify-between items-center p-3 border rounded bg-background">
              <span className="font-medium">Proof of Delivery (POD)</span>
              {shipment.pod_url ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center text-sm font-medium text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> Uploaded
                  </span>
                  <a href={toApiUrl(shipment.pod_url)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">View</Button>
                  </a>
                  <a href={toApiUrl(shipment.pod_url)} download target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">Download</Button>
                  </a>
                  {canUploadPOD && shipment.status !== 'COMPLETED' && shipment.status !== 'POD_UPLOADED' && (
                    <Button variant="ghost" onClick={() => setIsPodModalOpen(true)} size="sm">Replace</Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {canUploadPOD ? (
                    <Button onClick={() => setIsPodModalOpen(true)} size="sm">Upload POD</Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Pending</span>
                  )}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
      
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
      return { next: 'PICKUP_STARTED', label: 'Start Pickup' };
    case 'PICKUP_STARTED':
      return { next: 'PICKUP_COMPLETED', label: 'Mark Picked Up' };
    case 'PICKUP_COMPLETED':
      return { next: 'IN_TRANSIT', label: 'Mark Transit' };
    case 'IN_TRANSIT': 
      return { next: 'DELIVERED', label: 'Mark Delivered' };
    case 'DELIVERED':
      return hasPOD ? null : { next: 'POD_UPLOAD', label: 'Upload POD' };
    default: 
      return null;
  }
}
