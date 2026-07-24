import { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CompanyVerification() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null);

  const { toast } = useToast();

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/admin/companies/pending');
      setCompanies(res.data);
    } catch (e) {
      console.error(e);
      toast('Failed to load pending companies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAction = async (id: string, action: 'verify' | 'reject') => {
    try {
      setProcessingId(id);
      setActionType(action);
      await api.post(`/admin/companies/${id}/${action}`);
      toast(`Company ${action === 'verify' ? 'verified' : 'rejected'} successfully`, 'success');
      await fetchCompanies();
    } catch (e: any) {
      toast(e.response?.data?.detail || `Failed to ${action} company`, 'error');
    } finally {
      setProcessingId(null);
      setActionType(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Company Verification</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and approve registered companies before enabling platform access.
          </p>
        </div>
      </div>
      
      <Card className="rounded-2xl shadow-sm border border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>DOT Number</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No pending companies requiring verification.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((c) => {
                  const isProcessing = processingId === c.id;
                  const isVerifying = isProcessing && actionType === 'verify';
                  const isRejecting = isProcessing && actionType === 'reject';

                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-foreground">{c.name}</TableCell>
                      <TableCell>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border">
                          {c.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{c.dot_number || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(c.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* Reject Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isProcessing}
                          onClick={() => handleAction(c.id, 'reject')}
                          className={`rounded-xl text-xs h-8 font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-all ${
                            isProcessing
                              ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground border-transparent'
                              : ''
                          }`}
                        >
                          {isRejecting ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Rejecting...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </span>
                          )}
                        </Button>

                        {/* Verify Button */}
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleAction(c.id, 'verify')}
                          className={`rounded-xl text-xs h-8 font-semibold transition-all ${
                            isVerifying
                              ? 'bg-emerald-800/40 text-emerald-200 cursor-not-allowed opacity-60'
                              : isProcessing
                              ? 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                          }`}
                        >
                          {isVerifying ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Verify
                            </span>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
