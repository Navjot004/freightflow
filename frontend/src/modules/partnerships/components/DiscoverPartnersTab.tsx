import { useEffect, useState } from 'react';
import { Search, MapPin, Truck, CheckCircle, Star, User, Building } from 'lucide-react';
import { PartnershipAPI, type PartnerDirectoryItem } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProfileDrawer } from './ProfileDrawer';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export default function DiscoverPartnersTab() {
  const [partners, setPartners] = useState<PartnerDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  const [selectedPartner, setSelectedPartner] = useState<PartnerDirectoryItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { toast } = useToast();
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    partner: PartnerDirectoryItem | null;
  }>({
    isOpen: false,
    partner: null
  });

  const fetchDirectory = async () => {
    try {
      const data = await PartnershipAPI.getDirectory();
      setPartners(data);
    } catch (error) {
      toast('Failed to load partner directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const executeSendRequest = async () => {
    if (!confirmModal.partner) return;
    const partner = confirmModal.partner;
    setConfirmModal({ isOpen: false, partner: null });

    try {
      await PartnershipAPI.sendRequest(partner.company.id, "We'd like to partner with you.");
      toast('Partnership request sent successfully', 'success');
      setIsDrawerOpen(false);
      fetchDirectory();
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to send request', 'error');
    }
  };

  const handleSendRequest = (action: 'partner' | 'assign', partner: PartnerDirectoryItem) => {
    if (action === 'assign') return; // Handled elsewhere
    setConfirmModal({ isOpen: true, partner });
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || p.company.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search and Filters */}
      <div className="bg-background p-4 rounded-xl shadow-sm border border-border flex flex-col md:flex-row gap-4 sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search partners by name..." 
            className="pl-10 bg-slate-50 dark:bg-slate-950 border-border text-foreground placeholder:text-slate-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'CARRIER', 'OWNER_OPERATOR'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterType === type 
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 bg-muted dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {type === 'ALL' ? 'All Partners' : type === 'CARRIER' ? 'Carriers' : 'Owner Operators'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-background rounded-xl p-5 border border-border">
              <div className="flex gap-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-20 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filteredPartners.length === 0 ? (
        <EmptyState 
          icon={<Search className="h-8 w-8 text-slate-400" />}
          title="No Partners Found" 
          description="Try adjusting your search or filters to find more companies."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPartners.map((partner) => (
            <div 
              key={partner.company.id} 
              className="group bg-background rounded-xl border border-border hover:border-blue-500/50 dark:hover:border-blue-500/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col cursor-pointer"
              onClick={() => { setSelectedPartner(partner); setIsDrawerOpen(true); }}
            >
              <div className="p-5 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="h-12 w-12 bg-slate-50 dark:bg-slate-950 rounded-lg flex items-center justify-center border border-border">
                      {partner.company.type === 'BROKER' ? <Building className="h-6 w-6 text-slate-400" /> : partner.company.type === 'CARRIER' ? <Truck className="h-6 w-6 text-slate-400" /> : <User className="h-6 w-6 text-slate-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {partner.company.name}
                      </h3>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1 text-green-500" /> Verified
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm gap-3">
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current mr-1" />
                    <span className="font-medium text-foreground">{partner.rating}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <div className="text-muted-foreground">
                    {partner.company.type === 'BROKER' ? 'Brokerage' : partner.company.type === 'CARRIER' ? `${partner.profile?.fleet_size || 0} Trucks` : partner.vehicle?.equipment_type || 'Owner Operator'}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 text-sm space-y-2 border border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" /> Regions</span>
                    <span className="text-foreground font-medium truncate max-w-[100px]" title={partner.company.type === 'CARRIER' ? partner.profile?.operating_regions?.join(', ') : 'National'}>
                      {partner.company.type === 'CARRIER' 
                        ? (partner.profile?.operating_regions?.[0] || 'National') + ((partner.profile?.operating_regions?.length ?? 0) > 1 ? '...' : '')
                        : 'National'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="text-foreground font-medium">{partner.completed_shipments}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 pt-0">
                {partner.partnership_status === 'CONNECTED' ? (
                  <Button variant="outline" className="w-full text-green-700 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" disabled>
                    Connected Partner
                  </Button>
                ) : partner.partnership_status === 'PENDING' ? (
                  <Button variant="outline" className="w-full text-foreground border-slate-300 dark:border-slate-700 bg-slate-50 bg-muted" disabled>
                    Request Pending
                  </Button>
                ) : (
                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleSendRequest('partner', partner); }}>
                    Partner
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        partner={selectedPartner} 
        onAction={handleSendRequest}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, partner: null })}
        onConfirm={executeSendRequest}
        title="Send Partnership Request"
        message={
          confirmModal.partner 
            ? `Are you sure you want to send a partnership request to ${confirmModal.partner.company.name}?` 
            : "Are you sure you want to send a partnership request?"
        }
        confirmText="Send Request"
        variant="primary"
      />
    </div>
  );
}
