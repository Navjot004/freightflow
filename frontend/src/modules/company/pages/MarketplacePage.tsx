import { useEffect, useState, useCallback } from 'react';
import api from '../../../core/api';
import { useAuthStore } from '../../../store/authStore';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Search, MapPin, Calendar, Weight, ArrowUpDown, PackageOpen, Eye } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { MarketplaceLoadDetailModal } from '../components/MarketplaceLoadDetailModal';

export default function MarketplacePage() {
  const user = useAuthStore(state => state.user);
  const [data, setData] = useState<{ total: number, items: any[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 10;

  // Selected Load for Modal
  const [selectedLoad, setSelectedLoad] = useState<any>(null);

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
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLoad(load)}
                        className="rounded-xl text-xs font-semibold gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </Button>

                      {canBid && (
                        load.current_user_has_bidded ? (
                          <Button size="sm" variant="outline" disabled className="rounded-xl text-xs font-semibold">
                            Bid Submitted
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => setSelectedLoad(load)} className="rounded-xl text-xs font-semibold">
                            Place Bid
                          </Button>
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

      {/* Rich Marketplace Load Detail & Bidding Modal */}
      {selectedLoad && (
        <MarketplaceLoadDetailModal
          load={selectedLoad}
          canBid={canBid}
          onClose={() => setSelectedLoad(null)}
          onRefresh={fetchLoads}
        />
      )}
    </div>
  );
}
