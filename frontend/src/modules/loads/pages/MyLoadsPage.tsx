import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../core/api';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Skeleton } from '../../../components/ui/Skeleton';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Package } from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export default function MyLoadsPage() {
  const navigate = useNavigate();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const { toast } = useToast();

  const fetchLoads = async () => {
    try {
      const res = await api.get('/loads/me');
      setLoads(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads();
  }, []);

  const executeCancel = async () => {
    if (!confirmModal.id) return;
    const { id } = confirmModal;
    setConfirmModal({ isOpen: false, id: null });
    try {
      await api.patch(`/loads/${id}/cancel`);
      toast("Load cancelled.", 'success');
      fetchLoads();
    } catch (err) {
      toast("Failed to cancel load.", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">My Loads</h2>
        <Button onClick={() => navigate('/loads/create')}>Post New Load</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : loads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <EmptyState 
                      icon={<Package className="h-8 w-8 text-muted-foreground" />}
                      title="No loads posted" 
                      description="You haven't posted any loads yet. Create a load to start receiving bids."
                      actionLabel="Post New Load"
                      onAction={() => navigate('/loads/create')}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                loads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell>
                      <div className="font-medium">{load.origin_address}</div>
                      <div className="text-xs text-muted-foreground">to {load.destination_address}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(load.pickup_date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">- {new Date(load.delivery_date).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{load.equipment_type}</div>
                      <div className="text-xs text-muted-foreground">{load.weight_lbs} lbs</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={load.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 mr-2" onClick={() => navigate(`/loads/${load.id}`)}>
                        View Bids
                      </Button>
                      {load.status === 'OPEN_FOR_BIDDING' && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setConfirmModal({ isOpen: true, id: load.id })}>
                          Cancel
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
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeCancel}
        title="Cancel Load"
        message="Are you sure you want to cancel this load? This action cannot be undone."
        confirmText="Cancel Load"
        variant="danger"
      />
    </div>
  );
}
