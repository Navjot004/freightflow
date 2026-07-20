import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../core/api';
import { useAuthStore } from '../../../store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Search, MapPin, Calendar, Weight, ArrowUpDown, X, PackageOpen } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../components/ui/Toast';

export default function MarketplacePage() {
  const user = useAuthStore(state => state.user);
  const [data, setData] = useState<{ total: number, items: any[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 10;

  // Bidding Modal State
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [bidExpiry, setBidExpiry] = useState('');
  const [availablePickupDate, setAvailablePickupDate] = useState('');
  const [transitTimeEstimate, setTransitTimeEstimate] = useState('');
  const [bidLoading, setBidLoading] = useState(false);

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    try {
      const skip = page * limit;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_desc: sortDesc.toString(),
      });
      if (search) params.append('search', search);
      if (equipmentType) params.append('equipment_type', equipmentType);

      const res = await api.get(`/loads/marketplace?${params.toString()}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, equipmentType, sortBy, sortDesc]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchLoads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, equipmentType, sortBy, sortDesc]);

  useEffect(() => {
    fetchLoads();
  }, [page]);

  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(column);
      setSortDesc(true);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidLoading(true);
    try {
      await api.post(`/loads/${selectedLoad.id}/bids`, {
        amount: parseFloat(bidAmount),
        notes: bidNotes,
        available_pickup_date: availablePickupDate ? new Date(availablePickupDate).toISOString() : null,
        transit_time_estimate_hours: transitTimeEstimate ? parseInt(transitTimeEstimate) : null,
        expires_at: new Date(bidExpiry).toISOString()
      });
      toast('Bid submitted successfully!', 'success');
      setSelectedLoad(null);
      fetchLoads();
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to submit bid', 'error');
    } finally {
      setBidLoading(false);
    }
  };

  const totalPages = Math.ceil(data.total / limit);
  const isDispatcher = user?.role?.name === 'DISPATCHER';
  const canBid = !isDispatcher && (user?.company?.type === 'CARRIER' || user?.company?.type === 'OWNER_OPERATOR' || user?.company?.type === 'BROKER');

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Load Board</h2>
        
        <div className="flex w-full sm:w-auto gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search origin or destination..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={equipmentType}
            onChange={(e) => setEquipmentType(e.target.value)}
          >
            <option value="">All Equipment</option>
            <option value="DRY_VAN">Dry Van</option>
            <option value="REEFER">Reefer</option>
            <option value="FLATBED">Flatbed</option>
          </select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Shipper</TableHead>
                <TableHead>Route</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors" 
                  onClick={() => toggleSort('pickup_date')}
                >
                  <div className="flex items-center">
                    Dates <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 transition-colors" 
                  onClick={() => toggleSort('weight_lbs')}
                >
                  <div className="flex items-center">
                    Details <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64">
                    <EmptyState 
                      icon={<PackageOpen className="h-8 w-8 text-muted-foreground" />}
                      title="No loads available" 
                      description="Try adjusting your search or filter criteria to find more loads."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((load) => (
                  <TableRow key={load.id} className="transition-colors hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {load.shipper?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm font-medium"><MapPin className="h-3.5 w-3.5 mr-1 text-green-600 dark:text-green-500"/> {load.origin_address}</div>
                        <div className="flex items-center text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 mr-1 text-red-600 dark:text-red-500"/> {load.destination_address}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1"/> Pickup: {new Date(load.pickup_date).toLocaleDateString()}</div>
                        <div className="flex items-center text-muted-foreground"><Calendar className="h-3.5 w-3.5 mr-1"/> Del: {new Date(load.delivery_date).toLocaleDateString()}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{load.equipment_type.replace('_', ' ')}</div>
                      <div className="flex items-center text-xs text-muted-foreground"><Weight className="h-3 w-3 mr-1"/> {load.weight_lbs.toLocaleString()} lbs</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {canBid && (
                        load.current_user_has_bidded ? (
                          <Button size="sm" variant="outline" disabled>Bid Submitted</Button>
                        ) : (
                          <Button size="sm" onClick={() => setSelectedLoad(load)}>Place Bid</Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, data.total)} of {data.total} entries
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || loading}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bid Modal */}
      {selectedLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Submit Bid</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedLoad(null)} className="h-8 w-8 p-0 rounded-full"><X className="h-4 w-4"/></Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Bidding on route: <strong>{selectedLoad.origin_address}</strong> to <strong>{selectedLoad.destination_address}</strong>
              </div>
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div className="space-y-2">
                  <Label>Bid Amount ($)</Label>
                  <Input type="number" step="0.01" value={bidAmount} onChange={e => setBidAmount(e.target.value)} required min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Bid Expiration</Label>
                  <Input type="datetime-local" value={bidExpiry} onChange={e => setBidExpiry(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Available Pickup Date (Optional)</Label>
                    <Input type="datetime-local" value={availablePickupDate} onChange={e => setAvailablePickupDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Transit Time (Hours) (Optional)</Label>
                    <Input type="number" min="1" value={transitTimeEstimate} onChange={e => setTransitTimeEstimate(e.target.value)} placeholder="e.g. 48" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input type="text" placeholder="E.g., Team drivers, ready immediately" value={bidNotes} onChange={e => setBidNotes(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={bidLoading}>
                  {bidLoading ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
