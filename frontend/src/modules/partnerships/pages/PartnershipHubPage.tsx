import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { PartnershipAPI } from '../api';
import { Users, UserPlus, ShieldCheck, CheckCircle } from 'lucide-react';

import DiscoverPartnersTab from '../components/DiscoverPartnersTab';
import PendingRequestsTab from '../components/PendingRequestsTab';
import ReceivedRequestsTab from '../components/ReceivedRequestsTab';
import ConnectedPartnersTab from '../components/ConnectedPartnersTab';

export default function PartnershipHubPage() {
  const user = useAuthStore(state => state.user);
  const isBroker = user?.company?.type === 'BROKER';
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('partnership_active_tab');
    if (saved) return saved;
    return 'discover';
  });

  const [stats, setStats] = useState({
    totalPending: 0,
    connected: 0,
    sent: 0,
    received: 0
  });

  // Fetch summary stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [requests, network] = await Promise.all([
          PartnershipAPI.getRequests(),
          PartnershipAPI.getNetwork()
        ]);
        
        const sentCount = requests.filter((r: any) => r.broker_company_id === user?.company_id && r.status === 'PENDING').length;
        const receivedCount = requests.filter((r: any) => r.partner_company_id === user?.company_id && r.status === 'PENDING').length;
        
        setStats({
          totalPending: sentCount + receivedCount,
          connected: network.length,
          sent: sentCount,
          received: receivedCount
        });
      } catch (err) {
        console.error("Failed to load partnership stats", err);
      }
    };
    fetchStats();
  }, [user?.company_id, isBroker]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('partnership_active_tab', tabId);
  };

  const tabs = [
    { id: 'discover', label: 'Discover Partners' },
    { id: 'pending', label: 'Pending Requests' },
    { id: 'received', label: 'Received Requests' },
    { id: 'connected', label: 'Connected Partners' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Partnership Network</h2>
          <p className="text-muted-foreground mt-1">Manage your transportation partnerships and discover new opportunities.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center">
          <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Connected</div>
            <div className="text-2xl font-bold text-foreground">{stats.connected}</div>
          </div>
        </div>
        
        <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center">
          <div className="h-10 w-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mr-4">
            <UserPlus className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Pending</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalPending}</div>
          </div>
        </div>

        <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center">
          <div className="h-10 w-10 bg-slate-100 bg-muted rounded-full flex items-center justify-center mr-4">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Sent Requests</div>
            <div className="text-2xl font-bold text-foreground">{stats.sent}</div>
          </div>
        </div>

        <div className="bg-background border border-border rounded-lg p-4 shadow-sm flex items-center">
          <div className="h-10 w-10 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-4">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Received</div>
            <div className="text-2xl font-bold text-foreground">{stats.received}</div>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-border mt-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            const hasNotification = 
              (tab.id === 'pending' && stats.sent > 0) || 
              (tab.id === 'received' && stats.received > 0);

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive 
                    ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-700'}
                `}
              >
                {tab.label}
                {hasNotification && (
                  <span className="absolute top-3 -right-2 flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shrink-0">
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'discover' && <DiscoverPartnersTab />}
        {activeTab === 'pending' && <PendingRequestsTab />}
        {activeTab === 'received' && <ReceivedRequestsTab />}
        {activeTab === 'connected' && <ConnectedPartnersTab />}
      </div>
    </div>
  );
}
