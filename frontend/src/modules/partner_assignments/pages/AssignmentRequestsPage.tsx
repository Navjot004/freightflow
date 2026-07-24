import { useEffect, useState } from 'react';
import { PartnerAssignmentAPI, type AssignmentResponse } from '../api';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useToast } from '../../../components/ui/Toast';
import { Check, X, Truck, Loader2 } from 'lucide-react';

export default function AssignmentRequestsPage() {
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<{ id: string; action: 'accept' | 'reject' } | null>(null);
  const { toast } = useToast();

  const fetchAssignments = async () => {
    try {
      const data = await PartnerAssignmentAPI.getMyAssignments();
      setAssignments(data);
    } catch (error) {
      toast('Failed to fetch assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    if (processingId) return;
    setProcessingId({ id, action });
    try {
      if (action === 'accept') {
        await PartnerAssignmentAPI.acceptAssignment(id);
        toast('Assignment accepted successfully', 'success');
      } else {
        await PartnerAssignmentAPI.rejectAssignment(id);
        toast('Assignment rejected', 'info');
      }
      await fetchAssignments();
    } catch (error: any) {
      toast(error.response?.data?.detail || `Failed to ${action} assignment`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading assignments...
      </div>
    );
  }

  const pendingAssignments = assignments.filter(a => a.status === 'PENDING');
  const pastAssignments = assignments.filter(a => a.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground dark:text-white">Assignment Requests</h2>
      </div>

      {pendingAssignments.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-lg shadow p-8 text-center border border-border">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium text-foreground">No Pending Requests</h3>
          <p className="mt-1 text-muted-foreground">You don't have any pending assignment requests from Brokers right now.</p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow rounded-lg overflow-hidden border border-border">
          <ul className="divide-y divide-border">
            {pendingAssignments.map((assignment) => {
              const isProcessingThis = processingId?.id === assignment.id;
              const isAcceptingThis = isProcessingThis && processingId?.action === 'accept';
              const isRejectingThis = isProcessingThis && processingId?.action === 'reject';

              return (
                <li key={assignment.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-foreground dark:text-white">
                        Assignment Request from {assignment.broker?.name || 'Broker'}
                      </h3>
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <p><strong>Shipment ID:</strong> {assignment.shipment_id}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <strong>Status:</strong> <StatusBadge status={assignment.status} />
                        </div>
                        <p><strong>Date:</strong> {new Date(assignment.assigned_at).toLocaleString()}</p>
                        {assignment.notes && <p><strong>Notes:</strong> {assignment.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => handleAction(assignment.id, 'reject')}
                        disabled={!!processingId}
                        className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-800 text-sm font-medium rounded-md text-red-600 dark:text-red-400 bg-background hover:bg-red-50 dark:hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background transition-all"
                      >
                        {isRejectingThis ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        {isRejectingThis ? 'Rejecting...' : 'Reject'}
                      </button>

                      <button
                        onClick={() => handleAction(assignment.id, 'accept')}
                        disabled={!!processingId}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary transition-all"
                      >
                        {isAcceptingThis ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {isAcceptingThis ? 'Accepting...' : 'Accept'}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pastAssignments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-foreground dark:text-white mb-4">Past Assignments</h3>
          <div className="bg-card text-card-foreground shadow rounded-lg overflow-hidden border border-border">
            <ul className="divide-y divide-border">
              {pastAssignments.map((assignment) => (
                <li key={assignment.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground dark:text-white">
                      Broker: {assignment.broker?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <span>Status:</span> 
                      <StatusBadge status={assignment.status} />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.responded_at ? new Date(assignment.responded_at).toLocaleDateString() : ''}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
