import React, { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Input } from '../../../components/ui/input';
import { useToast } from '../../../components/ui/Toast';
import { useAuthStore } from '../../../store/authStore';

export default function DisputesManagement() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const user = useAuthStore(state => state.user);
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes');
      setDisputes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (id: string, status: string) => {
    try {
      await api.post(`/disputes/${id}/resolve`, { status, resolution_notes: notes });
      toast(`Dispute marked as ${status}`, 'success');
      setResolvingId(null);
      setNotes('');
      fetchDisputes();
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to resolve dispute', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Disputes</h2>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load ID</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead>Against</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {user?.role?.name === 'SUPER_ADMIN' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : disputes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No disputes found.</TableCell></TableRow>
              ) : (
                disputes.map((d) => (
                  <React.Fragment key={d.id}>
                    <TableRow>
                      <TableCell className="font-mono text-xs">{d.load_id.split('-')[0]}</TableCell>
                      <TableCell>{d.raised_by_company_id}</TableCell>
                      <TableCell>{d.against_company_id}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={d.reason}>{d.reason}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{d.status}</span>
                      </TableCell>
                      {user?.role?.name === 'SUPER_ADMIN' && (
                        <TableCell className="text-right">
                          {d.status === 'OPEN' && resolvingId !== d.id && (
                            <Button size="sm" onClick={() => setResolvingId(d.id)}>Resolve</Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                    
                    {resolvingId === d.id && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Resolution Notes</label>
                            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Type notes here..." />
                            <div className="flex gap-2 justify-end mt-2">
                              <Button size="sm" variant="ghost" onClick={() => setResolvingId(null)}>Cancel</Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleResolve(d.id, 'DISMISSED')}>Dismiss</Button>
                              <Button size="sm" className="bg-green-600" onClick={() => handleResolve(d.id, 'RESOLVED')}>Resolve</Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
