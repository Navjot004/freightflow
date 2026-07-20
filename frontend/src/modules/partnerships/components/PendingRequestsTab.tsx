import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { PartnershipAPI, type PartnershipResponse } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Send, Clock, X } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export default function PendingRequestsTab() {
  const [requests, setRequests] = useState<PartnershipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: string | null;
    companyName: string;
  }>({
    isOpen: false,
    id: null,
    companyName: ''
  });
  const { toast } = useToast();
  const user = useAuthStore(state => state.user);

  const fetchRequests = async () => {
    try {
      const data = await PartnershipAPI.getRequests();
      // Filter for requests sent BY the current user's company and are PENDING
      const sentPending = data.filter(r => r.broker_company_id === user?.company_id && r.status === 'PENDING');
      setRequests(sentPending);
    } catch (error) {
      toast('Failed to load pending requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const executeCancel = async () => {
    if (!confirmModal.id) return;
    const { id } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      // Assuming removePartnership works as a cancellation for pending requests as well
      await PartnershipAPI.removePartnership(id);
      toast('Request cancelled successfully', 'info');
      fetchRequests();
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to cancel request', 'error');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="bg-background rounded-xl p-5 border border-border">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-20 w-full mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState 
        icon={<Send className="h-8 w-8 text-slate-400" />}
        title="No Pending Requests" 
        description="You haven't sent any partnership requests that are waiting for a response."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
      {requests.map((req) => (
        <div key={req.id} className="bg-background rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-md flex flex-col">
          <div className="p-5 flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {req.partner?.name || 'Unknown Partner'}
                </h3>
                <div className="text-sm text-muted-foreground mt-1">
                  {req.partner?.type === 'CARRIER' ? 'Carrier Company' : 'Owner Operator'}
                </div>
              </div>
              <StatusBadge status="PENDING" />
            </div>

            <div className="text-sm text-muted-foreground flex items-center">
              <Clock className="h-4 w-4 mr-2 text-slate-400" />
              Sent {new Date(req.created_at).toLocaleDateString()}
            </div>

            {req.request_message && (
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
                <p className="text-sm italic text-slate-600 dark:text-slate-300">"{req.request_message}"</p>
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
              onClick={() => setConfirmModal({ isOpen: true, id: req.id, companyName: req.partner?.name || 'Unknown Partner' })}
            >
              <X className="h-4 w-4 mr-2" /> Cancel Request
            </Button>
          </div>
        </div>
      ))}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeCancel}
        title="Cancel Request"
        message={`Are you sure you want to cancel the partnership request to ${confirmModal.companyName}?`}
        confirmText="Cancel Request"
        variant="danger"
      />
    </div>
  );
}
