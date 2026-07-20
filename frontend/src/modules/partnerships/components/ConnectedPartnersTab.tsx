import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { PartnershipAPI, type PartnerDirectoryItem } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Network, Star, Truck, ShieldCheck, MapPin, Building, Search, XCircle, User } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export default function ConnectedPartnersTab() {
  const [partners, setPartners] = useState<PartnerDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
  const isBroker = user?.company?.type === 'BROKER';

  const fetchPartners = async () => {
    try {
      const data = await PartnershipAPI.getNetwork();
      setPartners(data);
    } catch (error) {
      toast('Failed to load connected partners', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const executeRemove = async () => {
    if (!confirmModal.id) return;
    const { id } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    try {
      await PartnershipAPI.removePartnership(id);
      toast('Partnership removed', 'success');
      fetchPartners();
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to remove partnership', 'error');
    }
  };

  const filteredPartners = partners.filter(p => 
    p.company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search */}
      <div className="bg-background p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search connected partners..." 
            className="pl-10 bg-slate-50 dark:bg-slate-950 border-border text-foreground placeholder:text-slate-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-background rounded-xl p-5 border border-border flex flex-col">
              <div className="flex gap-4 mb-6">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-24 w-full mb-4" />
              <div className="mt-auto flex gap-3">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPartners.length === 0 ? (
        <EmptyState 
          icon={<Network className="h-8 w-8 text-slate-400" />}
          title="No Connected Partners" 
          description={isBroker ? "Your Partner Network is empty. Go to Discover Partners to send requests." : "You are not connected to any brokers yet."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <div key={partner.partnership_id} className="group bg-background rounded-xl border border-border hover:border-blue-500/50 dark:hover:border-blue-500/50 overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="h-14 w-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-900/50 shrink-0">
                      {partner.company.type === 'BROKER' ? (
                        <Building className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                      ) : partner.company.type === 'OWNER_OPERATOR' ? (
                        <User className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                      ) : (
                        <Truck className="h-7 w-7 text-blue-500 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-tight mb-1">
                        {partner.company.name}
                      </h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        {partner.company.type === 'CARRIER' ? 'Carrier Company' : partner.company.type === 'OWNER_OPERATOR' ? 'Owner Operator' : 'Brokerage'}
                        <span className="mx-2 flex items-center text-green-600 dark:text-green-500 text-xs font-medium">
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Verified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center">
                    <div className="text-xl font-bold text-foreground flex items-center">
                      {partner.rating} <Star className="h-4 w-4 text-yellow-500 fill-current ml-1" />
                    </div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Rating</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-center">
                    <div className="text-xl font-bold text-foreground">
                      {partner.completed_shipments}
                    </div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">Completed</span>
                  </div>
                </div>

                {partner.company.type === 'BROKER' && (
                  <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      <span className="font-medium text-foreground">Operating Region</span>
                    </div>
                    <span className="ml-6">National Operations</span>
                  </div>
                )}
                
                {partner.company.type !== 'BROKER' && (
                  <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center font-medium text-foreground">
                        <Truck className="h-4 w-4 mr-2 text-slate-400" /> 
                        {partner.company.type === 'CARRIER' ? 'Fleet Size' : 'Equipment'}
                      </span>
                      <span className="font-bold text-foreground">
                        {partner.company.type === 'CARRIER' ? partner.profile?.fleet_size : partner.vehicle?.equipment_type || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {partner.company.type === 'CARRIER' && (partner.profile?.equipment_types?.length ? partner.profile.equipment_types : ['Dry Van', 'Reefer']).slice(0, 2).map(eq => (
                        <span key={eq} className="bg-background bg-muted border border-border text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                          {eq}
                        </span>
                      ))}
                      {partner.company.type === 'CARRIER' && (partner.profile?.equipment_types?.length || 2) > 2 && (
                        <span className="bg-background bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                          +{(partner.profile?.equipment_types?.length || 2) - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-border flex gap-3">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-900/20"
                  onClick={() => partner.partnership_id && setConfirmModal({ isOpen: true, id: partner.partnership_id, companyName: partner.company.name })}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Remove
                </Button>
                {/* Note: In a real app, Brokers might have an Assign button here leading to load creation/assignment flow */}
                <Button className="w-full" variant="outline">
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeRemove}
        title="Remove Partnership"
        message={`Are you sure you want to end your partnership with ${confirmModal.companyName}?`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
