import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { PartnershipAPI, type PartnershipResponse } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Inbox, Check, X, Star } from 'lucide-react';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export default function ReceivedRequestsTab() {
  const [requests, setRequests] = useState<PartnershipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'accept' | 'reject' | null;
    id: string | null;
    companyName: string;
  }>({
    isOpen: false,
    action: null,
    id: null,
    companyName: ''
  });
  const { toast } = useToast();
  const user = useAuthStore(state => state.user);

  const fetchRequests = async () => {
    try {
      const data = await PartnershipAPI.getRequests();
      // Filter for requests sent TO the current user's company and are PENDING
      const receivedPending = data.filter(r => r.partner_company_id === user?.company_id && r.status === 'PENDING');
      setRequests(receivedPending);
    } catch (error) {
      toast('Failed to load received requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const executeAction = async () => {
    if (!confirmModal.id || !confirmModal.action) return;
    const { id, action } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    try {
      if (action === 'accept') {
        await PartnershipAPI.acceptRequest(id);
        toast('Partnership accepted', 'success');
      } else {
        await PartnershipAPI.rejectRequest(id);
        toast('Partnership rejected', 'info');
      }
      fetchRequests();
    } catch (error: any) {
      toast(error.response?.data?.detail || `Failed to ${action} request`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="bg-background rounded-xl p-5 border border-border flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full mt-4" />
            </div>
            <div className="w-full md:w-40 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <EmptyState 
        icon={<Inbox className="h-8 w-8 text-slate-400" />}
        title="No Incoming Requests" 
        description="You have no pending partnership requests from brokers."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
      {requests.map((req) => (
        <div key={req.id} className="bg-background rounded-xl border-l-4 border-l-blue-500 border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-xl text-foreground mb-1">
                  {req.broker?.name || 'Brokerage Company'}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground gap-3">
                  <span>Broker</span>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-current mr-1" />
                    <span className="font-medium">4.9</span> {/* Stub rating for now */}
                  </div>
                </div>
              </div>

              {req.request_message && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800/50 relative">
                  <div className="absolute top-0 left-4 -mt-2 w-4 h-4 bg-slate-50 dark:bg-slate-950 border-t border-l border-slate-100 dark:border-slate-800/50 transform rotate-45" />
                  <p className="text-sm italic text-slate-600 dark:text-slate-300 relative z-10">"{req.request_message}"</p>
                </div>
              )}
              
              <div className="text-xs text-slate-400 dark:text-slate-500">
                Received on {new Date(req.created_at).toLocaleDateString()}
              </div>
            </div>
            
            <div className="w-full sm:w-40 flex flex-col gap-3 justify-center sm:border-l sm:border-slate-100 dark:sm:border-slate-800 sm:pl-6">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={() => setConfirmModal({ isOpen: true, action: 'accept', id: req.id, companyName: req.broker?.name || 'Brokerage Company' })}
              >
                <Check className="h-4 w-4 mr-2" /> Accept
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
                onClick={() => setConfirmModal({ isOpen: true, action: 'reject', id: req.id, companyName: req.broker?.name || 'Brokerage Company' })}
              >
                <X className="h-4 w-4 mr-2" /> Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={confirmModal.action === 'accept' ? 'Accept Partnership' : 'Reject Partnership'}
        message={
          confirmModal.action === 'accept'
            ? `Are you sure you want to accept the partnership request from ${confirmModal.companyName}?`
            : `Are you sure you want to reject the partnership request from ${confirmModal.companyName}?`
        }
        confirmText={confirmModal.action === 'accept' ? 'Accept' : 'Reject'}
        variant={confirmModal.action === 'accept' ? 'primary' : 'danger'}
      />
    </div>
  );
}
