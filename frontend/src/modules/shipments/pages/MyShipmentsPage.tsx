import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { toApiUrl } from '../../../core/api';
import { Timeline } from '../../../components/ui/Timeline';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ShipmentAPI } from '../api';
import { useAuthStore } from '../../../store/authStore';
import { PartnerAssignmentAPI, type Company } from '../../partner_assignments/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { MapPin, Navigation, Upload, User, Truck, FileText, CheckCircle, Package, LayoutGrid, List } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { PODUploadModal } from '../components/PODUploadModal';

export default function MyShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const user = useAuthStore(state => state.user);
  const { toast } = useToast();
  const isBroker = user?.company?.type === 'BROKER';
  const isOwnerOperator = user?.company?.type === 'OWNER_OPERATOR';
  const isCarrier = user?.company?.type === 'CARRIER';
  const isDriver = user?.role?.name === 'DRIVER';
  const canUploadPOD = isOwnerOperator || isDriver;
  const navigate = useNavigate();

  // Modals
  const [assignDriverShipment, setAssignDriverShipment] = useState<any>(null);
  const [updateLocationShipment, setUpdateLocationShipment] = useState<any>(null);
  
  // Assign Fleet Driver State
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [driverAssignmentNotes, setDriverAssignmentNotes] = useState('');
  
  // Assign Partner State (For Brokers)
  const [assignPartnerShipment, setAssignPartnerShipment] = useState<any>(null);
  const [availablePartners, setAvailablePartners] = useState<Company[]>([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  
  // Assign Dispatcher State
  const [assignDispatcherShipment, setAssignDispatcherShipment] = useState<any>(null);
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [selectedDispatcherId, setSelectedDispatcherId] = useState('');
  
  // Update Location State
  const [currentLocation, setCurrentLocation] = useState('');

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'update_status' | 'self_assign' | null;
    shipmentId: string | null;
    status?: string;
  }>({
    isOpen: false,
    action: null,
    shipmentId: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File Upload State for BOL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocType = 'bol';
  const [uploadShipmentId, setUploadShipmentId] = useState<string>('');

  // POD Modal State
  const [podModalShipmentId, setPodModalShipmentId] = useState<string | null>(null);

  const fetchShipments = async () => {
    try {
      const data = await ShipmentAPI.getMyShipments();
      setShipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchShipments();
    if (!isBroker && user?.role?.name !== 'DRIVER') {
      fetchDrivers();
      if (isCarrier && user?.role?.name === 'COMPANY_ADMIN') {
        api.get('/companies/me/employees').then(res => {
           setDispatchers(res.data.filter((e: any) => e.role?.name === 'DISPATCHER'));
        }).catch(err => console.error("Failed to load dispatchers", err));
      }
    }
  }, [isBroker, user, isCarrier]);

  const handleAssignDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post(`/shipments/${assignDriverShipment.id}/assign-fleet-driver`, {
        driver_id: selectedDriverId,
        notes: driverAssignmentNotes
      });
      setAssignDriverShipment(null);
      toast('Driver assigned successfully. Waiting for their acceptance.', 'success');
      fetchShipments();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to assign driver', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAssignPartner = async (shipment: any) => {
    setAssignPartnerShipment(shipment);
    try {
      const partners = await PartnerAssignmentAPI.getAvailablePartners();
      setAvailablePartners(partners);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await PartnerAssignmentAPI.assignPartner(assignPartnerShipment.id, selectedPartner, assignmentNotes);
      toast('Partner assigned successfully. Waiting for their acceptance.', 'success');
      setAssignPartnerShipment(null);
      setSelectedPartner('');
      setAssignmentNotes('');
      fetchShipments();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to assign partner', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignDispatcherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await ShipmentAPI.assignDispatcher(assignDispatcherShipment.id, selectedDispatcherId || null);
      toast('Dispatcher assigned successfully.', 'success');
      setAssignDispatcherShipment(null);
      fetchShipments();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to assign dispatcher', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimLoad = async (shipmentId: string) => {
    try {
      await ShipmentAPI.assignDispatcher(shipmentId, null);
      toast('Load claimed successfully.', 'success');
      fetchShipments();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to claim load', 'error');
    }
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post(`/shipments/${updateLocationShipment.id}/location`, {
        current_location: currentLocation
      });
      setUpdateLocationShipment(null);
      fetchShipments();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to update location', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmModal.shipmentId || !confirmModal.action) return;
    const { shipmentId, action, status } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (action === 'update_status' && status) {
      const previousShipments = [...shipments];
      setShipments(shipments.map(s => s.id === shipmentId ? { ...s, status } : s));

      try {
        await ShipmentAPI.updateStatus(shipmentId, status);
        toast('Status updated successfully.', 'success');
      } catch (err: any) {
        setShipments(previousShipments);
        toast(err.response?.data?.detail || 'Failed to update status', 'error');
      }
    } else if (action === 'self_assign') {
      try {
        await api.post(`/shipments/${shipmentId}/self-assign`);
        toast('Self assigned successfully!', 'success');
        fetchShipments();
      } catch (err: any) {
        toast(err.response?.data?.detail || 'Failed to self assign', 'error');
      }
    }
  };

  const handleUpdateStatus = (shipmentId: string, status: string) => {
    setConfirmModal({ isOpen: true, action: 'update_status', shipmentId, status });
  };

  const handleApprovePOD = async (shipmentId: string) => {
    const previousShipments = [...shipments];
    setShipments(shipments.map(s => s.id === shipmentId ? { ...s, status: 'COMPLETED' } : s));

    try {
      await ShipmentAPI.approvePOD(shipmentId);
      toast('POD Approved and Shipment Completed!', 'success');
    } catch (err: any) {
      setShipments(previousShipments);
      toast(err.response?.data?.detail || 'Failed to approve POD', 'error');
    }
  };

  const handleSelfAssign = (shipmentId: string) => {
    setConfirmModal({ isOpen: true, action: 'self_assign', shipmentId });
  };

  const handleRejectPOD = async (shipmentId: string) => {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    
    const previousShipments = [...shipments];
    setShipments(shipments.map(s => s.id === shipmentId ? { ...s, status: 'DISPUTED' } : s));

    try {
      await ShipmentAPI.rejectPOD(shipmentId);
      toast('POD Rejected and Dispute raised!', 'success');
    } catch (err: any) {
      setShipments(previousShipments);
      toast(err.response?.data?.detail || 'Failed to reject POD', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('doc_type', 'bol');
    formData.append('file', file);

    try {
      await ShipmentAPI.uploadDocument(uploadShipmentId, uploadDocType.toUpperCase() as 'BOL' | 'POD', file);
      toast('Document uploaded successfully!', 'success');
      fetchShipments();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to upload document', 'error');
    }
    
    // Reset
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadShipmentId('');
  };


  const getNextStatusAction = (currentStatus: string) => {
    switch (currentStatus) {
      case 'TENDER_ACCEPTED': return isOwnerOperator ? null : { next: 'DRIVER_ASSIGNED', label: 'Assign Driver (Required)' };
      case 'DRIVER_ASSIGNED': return { next: 'PICKUP_STARTED', label: 'Start Pickup' };
      case 'DRIVER_ACCEPTED': return { next: 'PICKUP_STARTED', label: 'Start Pickup' };
      case 'PICKUP_STARTED': return { next: 'PICKUP_COMPLETED', label: 'Mark Picked Up' };
      case 'PICKUP_COMPLETED': return { next: 'IN_TRANSIT', label: 'Mark In Transit' };
      case 'IN_TRANSIT': return { next: 'DELIVERED', label: 'Mark Delivered' };
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Active Shipments</h2>
          <p className="text-muted-foreground">Manage your assigned freight, update tracking, and upload documents.</p>
        </div>
        <div className="flex items-center rounded-lg border p-1 bg-muted/30">
          <Button 
            variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="flex items-center h-8 shadow-none"
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Cards
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="flex items-center h-8 shadow-none"
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4 mr-2" />
            Table
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" />

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={`skeleton-${i}`}>
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                  <div className="p-4 space-y-3"><Skeleton className="h-4 w-24 mb-4" /><Skeleton className="h-16 w-full" /></div>
                  <div className="p-4 space-y-3"><Skeleton className="h-4 w-32 mb-4" /><Skeleton className="h-16 w-full" /></div>
                  <div className="p-4 space-y-3"><Skeleton className="h-4 w-24 mb-4" /><Skeleton className="h-20 w-full" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <EmptyState 
          icon={<Package className="h-8 w-8 text-muted-foreground" />}
          title="No active shipments" 
          description="You don't have any active shipments at the moment. Accepted tenders will appear here."
        />
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-6">
          {shipments.map((s) => {
            const nextAction = getNextStatusAction(s.status || s.load.status);
            
            return (
              <Card key={s.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-green-600"/> {s.load.origin_address} 
                        <span className="mx-2 text-muted-foreground">→</span> 
                        <MapPin className="h-4 w-4 mr-2 text-red-600"/> {s.load.destination_address}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center">
                        <span className="mr-2">Status:</span>
                        <StatusBadge status={s.status || s.load.status} />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/shipments/execute/${s.id}`)}>
                        View Details
                      </Button>

                      {nextAction && s.load.status !== 'TENDER_ACCEPTED' && !isBroker && (
                        <Button size="sm" onClick={() => handleUpdateStatus(s.id, nextAction.next)} className="bg-blue-600 hover:bg-blue-700">
                          {nextAction.label}
                        </Button>
                      )}
                      
                      {s.load.status === 'TENDER_ACCEPTED' && isCarrier && (
                        <Button size="sm" onClick={() => { setAssignDriverShipment(s); setSelectedDriverId(''); setDriverAssignmentNotes(''); }}>
                          Assign Driver
                        </Button>
                      )}

                      {s.load.status === 'TENDER_ACCEPTED' && isOwnerOperator && (
                        <Button size="sm" onClick={() => handleSelfAssign(s.id)}>
                          Self Assign
                        </Button>
                      )}
                      
                      {(s.load.status === 'OPEN_FOR_BIDDING' || s.load.status === 'DRAFT') && isBroker && (
                        <Button size="sm" onClick={() => handleOpenAssignPartner(s)}>
                          Assign Partner
                        </Button>
                      )}

                      {isCarrier && s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && (
                         user?.role?.name === 'DISPATCHER' ? (
                           !s.dispatcher_id ? (
                             <Button size="sm" onClick={() => handleClaimLoad(s.id)} variant="secondary">Claim Load</Button>
                           ) : s.dispatcher_id === user.id ? (
                             <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 self-center font-medium">Your Load</span>
                           ) : null
                         ) : (
                           <Button size="sm" onClick={() => { setAssignDispatcherShipment(s); setSelectedDispatcherId(s.dispatcher_id || ''); }} variant="secondary">
                             {s.dispatcher_id ? 'Change Dispatcher' : 'Assign Dispatcher'}
                           </Button>
                         )
                      )}

                      {user?.company?.type === 'SHIPPER' && s.status === 'POD_UPLOADED' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 mr-2" onClick={() => handleApprovePOD(s.id)}>Approve POD</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleRejectPOD(s.id)}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                 </CardHeader>
                
                <CardContent className="p-0">
                  {/* Timeline Bar */}
                  <Timeline 
                    steps={[
                      { id: 'WAITING_FOR_DRIVER_ASSIGNMENT', label: 'Tender Accepted' },
                      { id: 'DRIVER_ASSIGNED', label: 'Driver Assigned' },
                      { id: 'DRIVER_ACCEPTED', label: 'Driver Accepted' },
                      { id: 'PICKUP_STARTED', label: 'Pickup Started' },
                      { id: 'PICKUP_COMPLETED', label: 'Picked Up' },
                      { id: 'IN_TRANSIT', label: 'In Transit' },
                      { id: 'DELIVERED', label: 'Delivered' },
                      { id: 'POD_UPLOADED', label: 'POD Uploaded' },
                      { id: 'COMPLETED', label: 'Completed' }
                    ]}
                    currentStepId={s.status || 'WAITING_FOR_DRIVER_ASSIGNMENT'}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-semibold flex items-center text-muted-foreground uppercase">
                        <User className="h-4 w-4 mr-2"/> Dispatch Info
                      </h4>
                      
                      {isCarrier && (
                        <div className="text-sm space-y-1 mb-3 pb-3 border-b border-dashed">
                          <div className="font-medium text-muted-foreground">Assigned Dispatcher:</div>
                          {s.dispatcher ? (
                            <div className="font-semibold">{s.dispatcher.first_name} {s.dispatcher.last_name}</div>
                          ) : (
                            <div className="text-orange-600 font-medium italic">Unassigned (Shared Pool)</div>
                          )}
                        </div>
                      )}
                      
                      {s.driver_name ? (
                        <div className="text-sm space-y-1">
                          <div className="font-medium">Carrier: {s.carrier?.name || 'N/A'}</div>
                          <div className="text-muted-foreground">Contact: {s.carrier?.contact_email || 'N/A'}</div>
                          <div className="flex items-center mt-2"><Truck className="h-4 w-4 mr-2 text-muted-foreground"/> {s.truck_number || 'N/A'}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">No driver assigned yet.</div>
                      )}
                    </div>
                    
                    {/* Tracking */}
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-semibold flex items-center text-muted-foreground uppercase"><Navigation className="h-4 w-4 mr-2"/> Location Tracking</h4>
                      <div className="text-sm">
                        <span className="font-medium">Current Location:</span><br/>
                        {s.current_location || <span className="text-muted-foreground italic">Not reported yet</span>}
                      </div>
                      {(isDriver || isOwnerOperator) && (
                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => { setUpdateLocationShipment(s); setCurrentLocation(s.current_location || ''); }}>
                          Update Location
                        </Button>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="p-4 space-y-3">
                      <h4 className="text-sm font-semibold flex items-center text-muted-foreground uppercase"><FileText className="h-4 w-4 mr-2"/> Documents</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center">
                            BOL {s.bol_url ? <CheckCircle className="h-4 w-4 text-green-500 ml-2" /> : null}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">{s.bol_url ? 'Generated' : 'Pending'}</span>
                        </div>
                        {s.bol_url && (
                          <div className="flex items-center gap-4 mt-2 mb-2">
                            <a href={toApiUrl(s.bol_url)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View</a>
                            <a href={toApiUrl(s.bol_url)} download target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">Download</a>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t pt-2">
                          <span className="flex items-center">
                            POD {s.pod_url ? <CheckCircle className="h-4 w-4 text-green-500 ml-2" /> : null}
                          </span>
                          {canUploadPOD && s.status !== 'COMPLETED' && s.status !== 'POD_UPLOADED' ? (
                            <Button variant="ghost" size="sm" onClick={() => setPodModalShipmentId(s.id)}><Upload className="h-4 w-4 mr-1"/> {s.pod_url ? 'Replace' : 'Upload'}</Button>
                          ) : (
                            <span className="text-sm font-medium text-muted-foreground">{s.pod_url ? 'Uploaded' : 'Pending'}</span>
                          )}
                        </div>
                        {s.pod_url && (
                          <div className="flex items-center gap-4 mt-2">
                            <a href={toApiUrl(s.pod_url)} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">View</a>
                            <a href={toApiUrl(s.pod_url)} download target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block">Download</a>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver & Truck</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map(s => {
                  const nextAction = getNextStatusAction(s.status || s.load.status);
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{s.load.origin_address}</div>
                        <div className="text-xs text-muted-foreground">to {s.load.destination_address}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status || s.load.status} />
                      </TableCell>
                      <TableCell>
                        {s.driver_name ? (
                          <>
                            <div className="font-medium text-sm">{s.driver_name}</div>
                            <div className="text-xs text-muted-foreground">{s.truck_number || 'N/A'}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate max-w-[200px]" title={s.current_location}>
                          {s.current_location || <span className="text-muted-foreground italic">Not reported yet</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/shipments/execute/${s.id}`)}>
                            View Details
                          </Button>
                          {nextAction && s.load.status !== 'TENDER_ACCEPTED' && !isBroker && (
                            <Button size="sm" onClick={() => handleUpdateStatus(s.id, nextAction.next)} className="bg-blue-600 hover:bg-blue-700">
                              {nextAction.label}
                            </Button>
                          )}
                          {isCarrier && s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && (
                            <>
                              {user?.role?.name === 'DISPATCHER' ? (
                                !s.dispatcher_id ? (
                                  <Button size="sm" onClick={() => handleClaimLoad(s.id)} variant="secondary">Claim Load</Button>
                                ) : s.dispatcher_id === user.id ? (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200 self-center font-medium">Your Load</span>
                                ) : null
                              ) : (
                                <>
                                  {s.load.status === 'TENDER_ACCEPTED' && (
                                    <Button size="sm" onClick={() => { setAssignDriverShipment(s); setSelectedDriverId(''); setDriverAssignmentNotes(''); }}>
                                      Assign Driver
                                    </Button>
                                  )}
                                  <Button size="sm" onClick={() => { setAssignDispatcherShipment(s); setSelectedDispatcherId(s.dispatcher_id || ''); }} variant="secondary">
                                    {s.dispatcher_id ? 'Change Dispatcher' : 'Assign Dispatcher'}
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                          {s.load.status === 'TENDER_ACCEPTED' && isOwnerOperator && (
                            <Button size="sm" onClick={() => handleSelfAssign(s.id)}>
                              Self Assign
                            </Button>
                          )}
                          {(s.load.status === 'OPEN_FOR_BIDDING' || s.load.status === 'DRAFT') && isBroker && (
                            <Button size="sm" onClick={() => handleOpenAssignPartner(s)}>
                              Assign Partner
                            </Button>
                          )}
                          {user?.company?.type === 'SHIPPER' && s.status === 'POD_UPLOADED' && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleApprovePOD(s.id)}>Approve POD</Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleRejectPOD(s.id)}>Reject</Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Assign Driver Modal */}
      {assignDriverShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader>
              <CardTitle>Assign Driver</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignDriverSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Driver</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedDriverId}
                    onChange={e => setSelectedDriverId(e.target.value)}
                    required
                  >
                    <option value="">-- Select a Driver --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.user_id} disabled={d.status !== 'AVAILABLE'}>
                        {d.first_name} {d.last_name} {d.manager_name ? `(${d.manager_name})` : ''} - {d.status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input value={driverAssignmentNotes} onChange={e => setDriverAssignmentNotes(e.target.value)} placeholder="Special instructions" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setAssignDriverShipment(null)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedDriverId || isSubmitting}>
                    {isSubmitting ? 'Assigning...' : 'Assign Driver'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Partner Modal (Brokers only) */}
      {assignPartnerShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader>
              <CardTitle>Assign Partner</CardTitle>
              <CardDescription>Select a verified partner to execute this shipment.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignPartnerSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Partner</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedPartner}
                    onChange={e => setSelectedPartner(e.target.value)}
                    required
                  >
                    <option value="">-- Select a Partner --</option>
                    {availablePartners.map((p: any) => {
                      const comp = p.company || p;
                      return <option key={comp.id} value={comp.id}>{comp.company_name || comp.name}</option>;
                    })}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input value={assignmentNotes} onChange={e => setAssignmentNotes(e.target.value)} placeholder="Special instructions" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setAssignPartnerShipment(null)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedPartner || isSubmitting}>
                    {isSubmitting ? 'Assigning...' : 'Assign Partner'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Assign Dispatcher Modal */}
      {assignDispatcherShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader>
              <CardTitle>Assign Dispatcher</CardTitle>
              <CardDescription>Assign this load to a specific dispatcher in your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignDispatcherSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Dispatcher</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedDispatcherId}
                    onChange={e => setSelectedDispatcherId(e.target.value)}
                    required
                  >
                    <option value="">-- Shared Pool (Unassigned) --</option>
                    {dispatchers.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <Button type="button" variant="outline" onClick={() => setAssignDispatcherShipment(null)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Assigning...' : 'Assign Load'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Location Modal */}
      {updateLocationShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader>
              <CardTitle>Update Location</CardTitle>
              <CardDescription>Share current location (City, State or Zip).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateLocation} className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Location</Label>
                  <Input value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} required placeholder="e.g. Memphis, TN" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                  <Button type="button" variant="outline" onClick={() => setUpdateLocationShipment(null)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!currentLocation || isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeConfirmAction}
        title={confirmModal.action === 'update_status' ? 'Update Status' : 'Self Assign'}
        message={
          confirmModal.action === 'update_status' 
            ? `Update shipment status to ${confirmModal.status}?`
            : 'Self assign to this shipment?'
        }
        confirmText="Confirm"
        variant="primary"
      />

      {podModalShipmentId && (
        <PODUploadModal 
          isOpen={!!podModalShipmentId} 
          onClose={() => setPodModalShipmentId(null)} 
          shipmentId={podModalShipmentId} 
          onUploadSuccess={() => {
            fetchShipments();
          }} 
        />
      )}

    </div>
  );
}
