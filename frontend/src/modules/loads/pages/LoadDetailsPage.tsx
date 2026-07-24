import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { toApiUrl } from '../../../core/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/button';
import { MapPin, Calendar, Weight, ArrowLeft, RefreshCw, Edit3 } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { EditLoadModal } from '../components/EditLoadModal';

export default function LoadDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [load, setLoad] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [bids, setBids] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'send_tender' | 'next_bidder' | null;
    bid?: any;
  }>({
    isOpen: false,
    action: null
  });

  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const loadsRes = await api.get('/loads/me');
      const targetLoad = loadsRes.data.find((l: any) => l.id === id);
      setLoad(targetLoad);

      if (targetLoad) {
        const [bidsRes, tendersRes] = await Promise.all([
          api.get(`/loads/${id}/bids`),
          api.get(`/loads/${id}/tenders`)
        ]);
        setBids(bidsRes.data);
        setTenders(tendersRes.data);
        
        // Try to fetch shipment if it's past bidding phase
        if (targetLoad.status !== 'OPEN_FOR_BIDDING' && targetLoad.status !== 'TENDER_SENT') {
          try {
            const shipRes = await api.get(`/loads/${id}/shipment`);
            setShipment(shipRes.data);
          } catch (e) {
            console.log("No shipment yet");
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const executeAction = async () => {
    if (!confirmModal.action) return;
    const { action, bid } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (action === 'send_tender' && bid) {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // default 24h expiry
        
        await api.post(`/loads/${id}/tenders`, {
          carrier_id: bid.carrier_id,
          amount: bid.amount,
          expires_at: expiresAt.toISOString(),
          bid_id: bid.id
        });
        toast('Tender Sent Successfully!', 'success');
        fetchData();
      } catch (err: any) {
        toast(err.response?.data?.detail || 'Failed to send tender', 'error');
      }
    } else if (action === 'next_bidder') {
      try {
        await api.post(`/loads/${id}/tenders/next`);
        toast('Auto-Tender Sent Successfully!', 'success');
        fetchData();
      } catch (err: any) {
        toast(err.response?.data?.detail || 'Failed to auto-tender next bidder', 'error');
      }
    }
  };

  const handleSendTender = (bid: any) => {
    setConfirmModal({ isOpen: true, action: 'send_tender', bid });
  };

  const handleNextBidder = () => {
    setConfirmModal({ isOpen: true, action: 'next_bidder' });
  };

  if (loading) return <div>Loading details...</div>;
  if (!load) return <div>Load not found.</div>;

  const hasActiveTender = tenders.some(t => t.status === 'PENDING' || t.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/loads/my-loads')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Load Operations</h2>
        </div>
        <div className="flex items-center gap-2">
          {(load.status === 'OPEN_FOR_BIDDING' || load.status === 'DRAFT') && (
            <Button
              onClick={() => setShowEditModal(true)}
              variant="outline"
              className="text-xs font-semibold rounded-xl gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Load Details
            </Button>
          )}

          {!hasActiveTender && load.status !== 'OPEN_FOR_BIDDING' && (
            <Button onClick={handleNextBidder} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs font-semibold rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" /> Auto-Tender Next Lowest Bid
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Load Overview */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Load Info</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1.5">
              <span>Status:</span>
              <StatusBadge status={load.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start">
              <MapPin className="h-5 w-5 mr-3 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <div className="font-semibold text-green-700">Origin</div>
                <div>{load.origin_address}</div>
                <div className="mt-2 font-semibold text-red-700">Destination</div>
                <div>{load.destination_address}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Calendar className="h-5 w-5 mr-3 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <div><span className="font-semibold">Pick:</span> {new Date(load.pickup_date).toLocaleString()}</div>
                <div><span className="font-semibold">Drop:</span> {new Date(load.delivery_date).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex items-start">
              <Weight className="h-5 w-5 mr-3 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <div><span className="font-semibold">Type:</span> {load.equipment_type}</div>
                <div><span className="font-semibold">Weight:</span> {load.weight_lbs.toLocaleString()} lbs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {shipment && (
          <Card className="md:col-span-1 border-primary/20">
            <CardHeader className="pb-2 bg-primary/5 border-b">
              <CardTitle className="text-lg text-primary">Execution Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="font-semibold text-muted-foreground block">Carrier</span>
                <div className="font-medium">{shipment.carrier?.name}</div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <span className="font-semibold text-muted-foreground block">Driver</span>
                {shipment.driver_name ? (
                  <>
                    <div>{shipment.driver_name}</div>
                    <div className="text-muted-foreground">{shipment.driver_phone}</div>
                    {shipment.truck_number && <div className="text-muted-foreground">Truck: {shipment.truck_number}</div>}
                  </>
                ) : <div className="text-muted-foreground italic">Awaiting Assignment</div>}
              </div>

              <div className="pt-2 border-t border-border">
                <span className="font-semibold text-muted-foreground block">Current Location</span>
                <div>{shipment.current_location || <span className="italic text-muted-foreground">Not updated</span>}</div>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">BOL</span>
                {shipment.bol_url ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground">Generated</span>
                    <a href={toApiUrl(shipment.bol_url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                    <a href={toApiUrl(shipment.bol_url)} download target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Download</a>
                  </div>
                ) : <span className="text-muted-foreground">Pending</span>}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted-foreground">POD</span>
                {shipment.pod_url ? (
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground">Uploaded</span>
                    <a href={toApiUrl(shipment.pod_url)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                    <a href={toApiUrl(shipment.pod_url)} download target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Download</a>
                  </div>
                ) : <span className="text-muted-foreground">Pending</span>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post-Execution Actions */}
        {load.status === 'COMPLETED' && shipment && (
          <Card className="md:col-span-3 mt-6 border-emerald-500/20">
            <CardHeader className="bg-emerald-500/5">
              <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400">Post-Execution Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Leave a Rating */}
              <div className="space-y-4">
                <h4 className="font-semibold">Leave a Rating</h4>
                <div className="space-y-2">
                  <label className="text-sm">Score (1-5)</label>
                  <input type="number" min="1" max="5" value={ratingScore} onChange={e => setRatingScore(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm">Comment</label>
                  <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <Button onClick={async () => {
                  try {
                    await api.post('/ratings', { load_id: load.id, score: ratingScore, comment: ratingComment });
                    toast('Rating submitted!', 'success');
                  } catch (e: any) {
                    toast(e.response?.data?.detail || 'Failed to submit', 'error');
                  }
                }}>Submit Rating</Button>
              </div>

              {/* Raise a Dispute */}
              <div className="space-y-4 border-l pl-8">
                <h4 className="font-semibold text-red-600">Raise a Dispute</h4>
                <p className="text-xs text-muted-foreground">If there was an issue with payment, damages, or service, open a dispute for admin review.</p>
                <div className="space-y-2">
                  <label className="text-sm">Reason for Dispute</label>
                  <textarea value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <Button variant="destructive" onClick={async () => {
                  try {
                    await api.post('/disputes', { load_id: load.id, reason: disputeReason });
                    toast('Dispute raised successfully. Admins will review.', 'success');
                  } catch (e: any) {
                    toast(e.response?.data?.detail || 'Failed to submit', 'error');
                  }
                }}>Open Dispute</Button>
              </div>

            </CardContent>
          </Card>
        )}

        <div className="md:col-span-2 space-y-6">
          {/* Tenders Section */}
          <Card>
            <CardHeader>
              <CardTitle>Tender History</CardTitle>
              <CardDescription>Formal offers sent to carriers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenders.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-4">No tenders sent yet.</TableCell></TableRow>
                  ) : (
                    tenders.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.carrier?.name}</TableCell>
                        <TableCell className="font-bold">${t.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm">{new Date(t.expires_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bids Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Incoming Bids</CardTitle>
              <CardDescription>Compare active bids from carriers. Sorted by lowest price.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No bids received yet.</TableCell></TableRow>
                  ) : (
                    bids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell className="font-medium">
                          {bid.carrier?.name || 'Unknown Carrier'}
                          {bid.notes && <div className="text-xs text-muted-foreground mt-1">Note: {bid.notes}</div>}
                        </TableCell>
                        <TableCell className="font-bold">${bid.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusBadge status={bid.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {bid.status === 'PENDING' && !hasActiveTender && (
                            <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => handleSendTender(bid)}>
                              Send Tender
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {showEditModal && (
        <EditLoadModal
          load={load}
          onClose={() => setShowEditModal(false)}
          onRefresh={fetchData}
        />
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={confirmModal.action === 'send_tender' ? 'Send Tender' : 'Auto-Tender'}
        message={
          confirmModal.action === 'send_tender' && confirmModal.bid
            ? `Send tender to ${confirmModal.bid.carrier?.name} for $${confirmModal.bid.amount}?`
            : 'Automatically tender the next lowest pending bid?'
        }
        confirmText="Confirm"
        variant="primary"
      />
    </div>
  );
}
