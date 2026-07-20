import { useEffect, useState } from 'react';
import { PartnerAssignmentAPI, type AssignmentResponse } from '../api';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useToast } from '../../../components/ui/Toast';
import { Check, X, Truck } from 'lucide-react';

export default function AssignmentRequestsPage() {
  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssignments = async () => {
    try {
      const data = await PartnerAssignmentAPI.getMyAssignments();
      // Filter for carriers typically we just want to see all our requests, maybe filter by PENDING
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
    try {
      if (action === 'accept') {
        await PartnerAssignmentAPI.acceptAssignment(id);
        toast('Assignment accepted successfully', 'success');
      } else {
        await PartnerAssignmentAPI.rejectAssignment(id);
        toast('Assignment rejected', 'info');
      }
      fetchAssignments();
    } catch (error: any) {
      toast(error.response?.data?.detail || `Failed to ${action} assignment`, 'error');
    }
  };

  if (loading) return <div>Loading assignments...</div>;

  const pendingAssignments = assignments.filter(a => a.status === 'PENDING');
  const pastAssignments = assignments.filter(a => a.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground dark:text-white">Assignment Requests</h2>
      </div>

      {pendingAssignments.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-lg shadow p-8 text-center">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-foreground">No Pending Requests</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">You don't have any pending assignment requests from Brokers right now.</p>
        </div>
      ) : (
        <div className="bg-card text-card-foreground shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingAssignments.map((assignment) => (
              <li key={assignment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-foreground dark:text-white">
                      Assignment Request from {assignment.broker?.name || 'Broker'}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <p><strong>Shipment ID:</strong> {assignment.shipment_id}</p>
                      <div className="flex items-center space-x-2 text-sm"><strong>Status:</strong> <StatusBadge status={assignment.status} /></div>
                      <p><strong>Date:</strong> {new Date(assignment.assigned_at).toLocaleString()}</p>
                      {assignment.notes && <p><strong>Notes:</strong> {assignment.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3 ml-4">
                    <button
                      onClick={() => handleAction(assignment.id, 'reject')}
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-background hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(assignment.id, 'accept')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pastAssignments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-foreground dark:text-white mb-4">Past Assignments</h3>
          <div className="bg-card text-card-foreground shadow rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {pastAssignments.map((assignment) => (
                <li key={assignment.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground dark:text-white">
                      Broker: {assignment.broker?.name || 'Unknown'}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Status:</span> 
                      <StatusBadge status={assignment.status} />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
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
