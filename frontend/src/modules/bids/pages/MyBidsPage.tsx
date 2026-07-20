import React, { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { MapPin, X, FileText } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export default function MyBidsPage() {
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Edit Modal State
  const [editBid, setEditBid] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    bidId: string | null;
  }>({
    isOpen: false,
    bidId: null
  });

  const fetchBids = async () => {
    try {
      const res = await api.get('/bids/me');
      setBids(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const executeWithdraw = async () => {
    if (!confirmModal.bidId) return;
    const { bidId } = confirmModal;
    setConfirmModal({ isOpen: false, bidId: null });
    try {
      await api.patch(`/bids/${bidId}/withdraw`);
      toast('Bid withdrawn successfully', 'success');
      fetchBids();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to withdraw bid', 'error');
    }
  };

  const handleWithdraw = (bidId: string) => {
    setConfirmModal({ isOpen: true, bidId });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBid) return;
    setSaving(true);
    try {
      await api.put(`/bids/${editBid.id}`, { amount: parseFloat(amount) });
      toast('Bid updated successfully', 'success');
      setEditBid(null);
      fetchBids();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to update bid', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">My Active & Past Bids</h2>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Load Route</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : bids.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <EmptyState 
                      icon={<FileText className="h-8 w-8 text-muted-foreground" />}
                      title="No bids placed yet" 
                      description="Head over to the Marketplace to find loads and start bidding."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                bids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      {bid.load ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm font-medium"><MapPin className="h-3 w-3 mr-1 text-green-600"/> {bid.load.origin_address}</div>
                          <div className="flex items-center text-xs text-muted-foreground"><MapPin className="h-3 w-3 mr-1 text-red-600"/> {bid.load.destination_address}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Load Info Unavailable</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">${bid.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{new Date(bid.expires_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={bid.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {bid.status === 'PENDING' && (
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditBid(bid); setAmount(bid.amount.toString()); }}>Edit</Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleWithdraw(bid.id)}>Withdraw</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Bid</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditBid(null)} className="h-8 w-8 p-0 rounded-full"><X className="h-4 w-4"/></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>New Amount ($)</Label>
                  <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required min={1} />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Updating...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeWithdraw}
        title="Withdraw Bid"
        message="Are you sure you want to withdraw this bid?"
        confirmText="Withdraw"
        variant="danger"
      />
    </div>
  );
}
