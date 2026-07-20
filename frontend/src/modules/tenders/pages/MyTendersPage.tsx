import { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/button';
import { MapPin, Calendar, Inbox } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export default function MyTendersPage() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'accept' | 'reject' | null;
    tenderId: string | null;
  }>({
    isOpen: false,
    action: null,
    tenderId: null
  });
  const { toast } = useToast();

  const fetchTenders = async () => {
    try {
      const res = await api.get('/tenders/me');
      setTenders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const executeAction = async () => {
    if (!confirmModal.tenderId || !confirmModal.action) return;
    const { tenderId, action } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      await api.post(`/tenders/${tenderId}/${action}`);
      toast(`Tender ${action}ed successfully.`, 'success');
      fetchTenders();
    } catch (err: any) {
      toast(err.response?.data?.detail || `Failed to ${action} tender`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">My Tenders</h2>
      <p className="text-muted-foreground">Review formal offers sent to you by Shippers and Brokers.</p>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Shipper</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Dates</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : tenders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <EmptyState 
                      icon={<Inbox className="h-8 w-8 text-muted-foreground" />}
                      title="No tenders received" 
                      description="You haven't received any private load offers yet."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                tenders.map((tender) => (
                  <TableRow key={tender.id}>
                    <TableCell className="font-medium">{tender.shipper?.name}</TableCell>
                    <TableCell>
                      {tender.load ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-sm font-medium"><MapPin className="h-3 w-3 mr-1 text-green-600"/> {tender.load.origin_address}</div>
                          <div className="flex items-center text-xs text-muted-foreground"><MapPin className="h-3 w-3 mr-1 text-red-600"/> {tender.load.destination_address}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tender.load ? (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1"/> {new Date(tender.load.pickup_date).toLocaleDateString()}</div>
                          <div className="flex items-center text-muted-foreground"><Calendar className="h-3.5 w-3.5 mr-1"/> {new Date(tender.load.delivery_date).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">${tender.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{new Date(tender.expires_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={tender.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {tender.status === 'PENDING' && (
                        <div className="flex justify-end space-x-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmModal({ isOpen: true, action: 'accept', tenderId: tender.id })}>Accept</Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmModal({ isOpen: true, action: 'reject', tenderId: tender.id })}>Reject</Button>
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
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={confirmModal.action === 'accept' ? 'Accept Tender' : 'Reject Tender'}
        message={`Are you sure you want to ${confirmModal.action} this tender?`}
        confirmText={confirmModal.action === 'accept' ? 'Accept' : 'Reject'}
        variant={confirmModal.action === 'accept' ? 'primary' : 'danger'}
      />
    </div>
  );
}
