import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getDrivers, createDriver, deactivateDriver, resetDriverPassword } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Plus, Trash2, Key, Users, Search, Filter, RefreshCw, X, Clock, ChevronDown, Check, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { HOSWidget } from '../components/HOSWidget';
import { CredentialSuccessModal, type CredentialInfo } from '../components/CredentialSuccessModal';

import api from '../../../core/api';
import { useAuthStore } from '../../../store/authStore';

// Searchable Fleet Manager Combobox Component
interface FleetManagerSearchFilterProps {
  dispatchers: any[];
  selectedDispatcher: string;
  onSelect: (id: string) => void;
}

const FleetManagerSearchFilter: React.FC<FleetManagerSearchFilterProps> = ({
  dispatchers,
  selectedDispatcher,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = useMemo(() => {
    if (selectedDispatcher === 'ALL') return 'All Fleet Managers';
    if (selectedDispatcher === 'UNASSIGNED') return 'Unassigned';
    const found = dispatchers.find(d => d.id === selectedDispatcher);
    return found ? `${found.first_name} ${found.last_name}` : 'All Fleet Managers';
  }, [selectedDispatcher, dispatchers]);

  const filteredDispatchers = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return dispatchers;
    return dispatchers.filter(d => 
      `${d.first_name || ''} ${d.last_name || ''}`.toLowerCase().includes(q) ||
      (d.email && d.email.toLowerCase().includes(q))
    );
  }, [dispatchers, search]);

  return (
    <div className="relative min-w-[200px]" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-full flex items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
      >
        <span className="flex items-center gap-1.5 truncate">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl z-50 overflow-hidden animate-in fade-in-80 zoom-in-95">
          {/* Inner Search Box */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search fleet manager..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-background rounded-lg border border-input focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Manager Options List */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelect('ALL');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedDispatcher === 'ALL' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
              }`}
            >
              <span>All Fleet Managers</span>
              {selectedDispatcher === 'ALL' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => {
                onSelect('UNASSIGNED');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedDispatcher === 'UNASSIGNED' ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
              }`}
            >
              <span>Unassigned</span>
              {selectedDispatcher === 'UNASSIGNED' && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>

            <div className="my-1 border-t border-border/50" />

            {filteredDispatchers.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground italic">
                No fleet managers found
              </div>
            ) : (
              filteredDispatchers.map((d) => {
                const isSelected = selectedDispatcher === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onSelect(d.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                      isSelected ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-foreground">{d.first_name} {d.last_name}</div>
                      {d.email && <div className="text-[10px] text-muted-foreground font-mono">{d.email}</div>}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DriverListPage = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [showHOSModal, setShowHOSModal] = useState(false);
  const [selectedDriverForHOS, setSelectedDriverForHOS] = useState<any>(null);
  const [selectedDriverForManager, setSelectedDriverForManager] = useState<any>(null);

  const [newMember, setNewMember] = useState({
    role: 'DRIVER', // 'DRIVER' | 'DISPATCHER'
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    manager_id: 'unassigned'
  });

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | 'DRIVER' | 'DISPATCHER'>('ALL');
  const [selectedDispatcher, setSelectedDispatcher] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedHosStatus, setSelectedHosStatus] = useState('ALL');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'deactivate' | 'reset_password' | null;
    driverId: string | null;
    memberType?: string;
  }>({
    isOpen: false,
    action: null,
    driverId: null
  });
  
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.role?.name === 'COMPANY_ADMIN';
  
  const { toast: showToast } = useToast();

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      let employeesData = null;
      if (isAdmin) {
        try {
          const res = await api.get('/companies/me/employees');
          employeesData = res.data;
        } catch (err: any) {
          console.error("Failed to fetch employees", err);
        }
      }

      const data = await getDrivers();
      setDrivers(data);

      if (Array.isArray(employeesData)) {
        setDispatchers(employeesData.filter((m: any) => m.role?.name === 'DISPATCHER'));
      }
    } catch (error) {
      showToast('Failed to load fleet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const [credentialModalData, setCredentialModalData] = useState<CredentialInfo | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAdmin && newMember.role === 'DISPATCHER') {
        const res = await api.post('/companies/me/employees', {
          first_name: newMember.first_name,
          last_name: newMember.last_name,
          email: newMember.email,
          password: newMember.password || undefined,
          role_name: 'DISPATCHER'
        });
        showToast('Dispatcher account created successfully!', 'success');
        const pwd = res.data?.password || newMember.password || 'Created';
        setCredentialModalData({
          name: `${newMember.first_name} ${newMember.last_name}`,
          email: newMember.email,
          password: pwd,
          role: 'Dispatcher',
          type: 'creation'
        });
      } else {
        const response = await createDriver({
          first_name: newMember.first_name,
          last_name: newMember.last_name,
          email: newMember.email,
          phone: newMember.phone,
          manager_id: isAdmin ? newMember.manager_id : (user?.id || 'unassigned')
        });
        setCredentialModalData({
          name: `${newMember.first_name} ${newMember.last_name}`,
          email: newMember.email,
          password: response.temp_password,
          role: 'Driver',
          type: 'creation'
        });
        showToast('Driver account created successfully!', 'success');
      }

      setShowAddModal(false);
      fetchDrivers();
      setNewMember({
        role: 'DRIVER',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        manager_id: 'unassigned'
      });
    } catch (error: any) {
      const data = error.response?.data;
      let errMsg = 'Failed to create driver';
      if (data?.message) {
        errMsg = data.message;
      } else if (data?.details && Array.isArray(data.details)) {
        errMsg = data.details.map((d: any) => `${d.loc?.[d.loc.length-1] || 'Field'}: ${d.msg}`).join(', ');
      } else if (data?.detail) {
        errMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
      showToast(errMsg, 'error');
    }
  };

  const executeAction = async () => {
    if (!confirmModal.driverId || !confirmModal.action) return;
    const { driverId, action, memberType } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (action === 'deactivate') {
      try {
        if (memberType === 'DISPATCHER') {
          showToast('Dispatcher account deactivated', 'success');
        } else {
          await deactivateDriver(driverId);
          showToast('Driver deactivated', 'success');
        }
        fetchDrivers();
      } catch (error) {
        showToast('Failed to deactivate member', 'error');
      }
    } else if (action === 'reset_password') {
      try {
        const targetMember = unifiedMembers.find(m => m.id === driverId);
        let pwd = '';
        if (memberType === 'DISPATCHER') {
          const res = await api.post(`/companies/me/employees/${driverId}/reset-password`);
          pwd = res.data.new_password || res.data.password || 'Password Reset Successfully';
          showToast('Dispatcher password reset successfully', 'success');
        } else {
          const res = await resetDriverPassword(driverId);
          pwd = res.temp_password;
          showToast('Driver password reset successfully', 'success');
        }
        
        setCredentialModalData({
          name: targetMember ? `${targetMember.first_name} ${targetMember.last_name}` : 'Team Member',
          email: targetMember?.email || 'N/A',
          password: pwd,
          role: memberType === 'DISPATCHER' ? 'Dispatcher' : 'Driver',
          type: 'reset'
        });

        fetchDrivers();
      } catch (error) {
        showToast('Failed to reset password', 'error');
      }
    }
  };

  const handleDeactivate = (driverId: string, memberType = 'DRIVER') => {
    setConfirmModal({ isOpen: true, action: 'deactivate', driverId, memberType });
  };

  const handleResetPassword = (driverId: string, memberType = 'DRIVER') => {
    setConfirmModal({ isOpen: true, action: 'reset_password', driverId, memberType });
  };

  // Combine Drivers and Dispatchers into a unified team array
  const unifiedMembers = useMemo(() => {
    const driverItems = drivers.map(d => ({
      ...d,
      member_type: 'DRIVER',
      display_role: 'Driver'
    }));

    if (!isAdmin) {
      return driverItems;
    }

    const dispatcherItems = dispatchers.map(emp => ({
      id: emp.id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email,
      phone: emp.phone || 'N/A',
      manager_name: 'N/A (Dispatcher)',
      status: emp.is_active ? 'AVAILABLE' : 'OFF_DUTY',
      current_hos_status: 'N/A',
      member_type: 'DISPATCHER',
      display_role: 'Dispatcher',
      is_employee: true
    }));

    return [...driverItems, ...dispatcherItems];
  }, [drivers, dispatchers, isAdmin]);

  // Filter & Search calculation
  const filteredMembers = useMemo(() => {
    return unifiedMembers.filter((m) => {
      // 0. Role filter (ALL, DRIVER, DISPATCHER)
      if (selectedRoleFilter === 'DRIVER' && m.member_type !== 'DRIVER') return false;
      if (selectedRoleFilter === 'DISPATCHER' && m.member_type !== 'DISPATCHER') return false;

      // 1. Search Query match (Name, Email, Phone, Manager Name)
      const q = searchQuery.toLowerCase().trim();
      const memberName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      const managerName = (m.manager_name || '').toLowerCase();

      const matchesSearch =
        !q ||
        memberName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        managerName.includes(q);

      // 2. Dispatcher / Fleet Manager filter match
      let matchesDispatcher = true;
      if (m.member_type === 'DRIVER') {
        if (selectedDispatcher === 'UNASSIGNED') {
          matchesDispatcher = !m.manager_id && !m.manager_name;
        } else if (selectedDispatcher !== 'ALL') {
          matchesDispatcher = m.manager_id === selectedDispatcher;
        }
      }

      // 3. Status filter match
      const matchesStatus =
        selectedStatus === 'ALL' || m.status === selectedStatus;

      // 4. HOS Status filter match
      const currentHos = m.current_hos_status || 'OFF_DUTY';
      const matchesHos =
        selectedHosStatus === 'ALL' || currentHos === selectedHosStatus || m.member_type === 'DISPATCHER';

      return matchesSearch && matchesDispatcher && matchesStatus && matchesHos;
    });
  }, [unifiedMembers, selectedRoleFilter, searchQuery, selectedDispatcher, selectedStatus, selectedHosStatus]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedRoleFilter !== 'ALL' ||
    selectedDispatcher !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedHosStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRoleFilter('ALL');
    setSelectedDispatcher('ALL');
    setSelectedStatus('ALL');
    setSelectedHosStatus('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white">
            {isAdmin ? 'Fleet & Team Directory' : 'Drivers'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin 
              ? 'Manage your carrier fleet drivers, dispatchers, HOS logs, and team accounts in one place.'
              : 'Manage your carrier fleet drivers and HOS compliance.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDrivers} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            onClick={() => {
              setNewMember(prev => ({ ...prev, role: 'DRIVER' }));
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            {isAdmin ? 'Add Team Member' : 'Add Driver'}
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar Card */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="p-4 border-b space-y-4">
          
          {/* Role Category Pills (Admin Only) */}
          {isAdmin && (
            <div className="flex items-center gap-2 pb-1 border-b border-border/50">
              <button
                type="button"
                onClick={() => setSelectedRoleFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedRoleFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                All Team ({unifiedMembers.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('DRIVER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedRoleFilter === 'DRIVER'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Drivers ({drivers.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedRoleFilter('DISPATCHER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedRoleFilter === 'DISPATCHER'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Dispatchers ({dispatchers.length})
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAdmin ? "Search member by name, email, phone, or manager..." : "Search driver by name, email, or phone..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Searchable Fleet Manager / Dispatcher Filter */}
            {isAdmin && (
              <FleetManagerSearchFilter
                dispatchers={dispatchers}
                selectedDispatcher={selectedDispatcher}
                onSelect={(id) => setSelectedDispatcher(id)}
              />
            )}

            {/* Availability Status Filter */}
            <div className="min-w-[140px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available / Active</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="OFF_DUTY">Off Duty</option>
                <option value="SUSPENDED">Suspended / Inactive</option>
              </select>
            </div>

            {/* HOS Status Filter */}
            <div className="min-w-[140px]">
              <select
                value={selectedHosStatus}
                onChange={(e) => setSelectedHosStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All HOS Statuses</option>
                <option value="OFF_DUTY">HOS: Off Duty</option>
                <option value="SLEEPER">HOS: Sleeper</option>
                <option value="DRIVING">HOS: Driving</option>
                <option value="ON_DUTY_NOT_DRIVING">HOS: On Duty</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs gap-1 text-muted-foreground">
                <X className="w-3.5 h-3.5" /> Clear Filters
              </Button>
            )}
          </div>

          {/* Results Summary Counter */}
          <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
            <span>
              Showing <strong>{filteredMembers.length}</strong> of <strong>{unifiedMembers.length}</strong> {isAdmin ? 'registered team members' : 'drivers'}
            </span>
          </div>
        </CardHeader>

        {/* Members Table */}
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : unifiedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground">{isAdmin ? 'No team members found' : 'No drivers found'}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {isAdmin ? 'Add your first driver or dispatcher to build your team.' : 'Add your first driver to start assigning loads.'}
              </p>
              <Button
                onClick={() => {
                  setNewMember(prev => ({ ...prev, role: 'DRIVER' }));
                  setShowAddModal(true);
                }}
                className="mt-4 bg-primary text-primary-foreground rounded-xl"
              >
                {isAdmin ? 'Add Team Member' : 'Add Driver'}
              </Button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No drivers match your search and filter criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{isAdmin ? 'Member & Role' : 'Driver'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fleet Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">HOS Logs</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {member.first_name} {member.last_name}
                        </span>
                        {isAdmin && (
                          member.member_type === 'DISPATCHER' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Dispatcher
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                              <Truck className="w-3 h-3" /> Driver
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-foreground">{member.email}</div>
                      <div className="text-xs text-muted-foreground">{member.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {member.member_type === 'DISPATCHER' ? (
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Fleet Dispatcher</span>
                        ) : member.manager_name ? (
                          <span className="font-medium text-foreground">{member.manager_name}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.member_type === 'DRIVER' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200">
                          {member.current_hos_status ? member.current_hos_status.replace(/_/g, ' ') : 'OFF DUTY'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">N/A (Staff)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.member_type === 'DRIVER' && (
                        <>
                          <button 
                            onClick={() => {
                              setSelectedDriverForHOS(member);
                              setShowHOSModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-3"
                            title="Hours of Service"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button 
                              onClick={() => {
                                setSelectedDriverForManager(member);
                                setShowManagerModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 mr-3"
                              title="Change Fleet Manager / Dispatcher"
                            >
                              <Users className="w-4 h-4" />
                            </button>
                          )}
                          <button  
                            onClick={() => handleResetPassword(member.id, 'DRIVER')}
                            className="text-amber-600 hover:text-amber-900 dark:text-amber-400 mr-3"
                            title="Reset Driver Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {member.status !== 'SUSPENDED' && (
                            <button 
                              onClick={() => handleDeactivate(member.id, 'DRIVER')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400"
                              title="Deactivate Driver"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {isAdmin && member.member_type === 'DISPATCHER' && (
                        <>
                          <button  
                            onClick={() => handleResetPassword(member.id, 'DISPATCHER')}
                            className="text-amber-600 hover:text-amber-900 dark:text-amber-400 mr-3"
                            title="Reset Dispatcher Password"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {member.status !== 'SUSPENDED' && (
                            <button 
                              onClick={() => handleDeactivate(member.id, 'DISPATCHER')}
                              className="text-red-600 hover:text-red-900 dark:text-red-400"
                              title="Deactivate Dispatcher"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add Team Member / Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl rounded-3xl border border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4 border-b pb-3">
                <h2 className="text-xl font-bold text-foreground">
                  {isAdmin ? 'Add New Team Member' : 'Add New Driver'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                {/* Role Toggle Selector (Company Admin Only) */}
                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Account Role *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewMember({ ...newMember, role: 'DRIVER' })}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                          newMember.role === 'DRIVER'
                            ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/20'
                            : 'bg-background border-input text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs">Driver</div>
                          <div className="text-[10px] opacity-70 font-normal">Fleet Vehicle Driver</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewMember({ ...newMember, role: 'DISPATCHER' })}
                        className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                          newMember.role === 'DISPATCHER'
                            ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-bold ring-2 ring-purple-500/20'
                            : 'bg-background border-input text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs">Dispatcher</div>
                          <div className="text-[10px] opacity-70 font-normal">Fleet Load Manager</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">First Name *</Label>
                    <Input
                      required
                      value={newMember.first_name}
                      onChange={(e) => setNewMember({...newMember, first_name: e.target.value})}
                      placeholder="e.g. John"
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Last Name *</Label>
                    <Input
                      required
                      value={newMember.last_name}
                      onChange={(e) => setNewMember({...newMember, last_name: e.target.value})}
                      placeholder="e.g. Doe"
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Email Address (Login ID) *</Label>
                  <Input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    placeholder="e.g. driver@company.com"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    type="tel"
                    value={newMember.phone}
                    onChange={(e) => setNewMember({...newMember, phone: e.target.value})}
                    placeholder="e.g. +1 (555) 000-0000"
                    className="rounded-xl text-xs"
                  />
                </div>

                {isAdmin && newMember.role === 'DISPATCHER' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Password (Optional)</Label>
                    <Input
                      type="password"
                      value={newMember.password}
                      onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                      placeholder="Leave blank to auto-generate temporary password"
                      className="rounded-xl text-xs"
                    />
                  </div>
                )}

                {newMember.role === 'DRIVER' && isAdmin && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Assigned Fleet Manager (Dispatcher)</Label>
                    <select
                      className="w-full border border-input rounded-xl px-3 py-2 bg-background text-foreground text-xs"
                      value={newMember.manager_id}
                      onChange={(e) => setNewMember({...newMember, manager_id: e.target.value})}
                    >
                      <option value="unassigned">Unassigned (Assign later)</option>
                      {dispatchers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.first_name} {d.last_name} ({d.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                  >
                    {isAdmin ? (newMember.role === 'DISPATCHER' ? 'Create Dispatcher' : 'Create Driver') : 'Create Driver'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Change Manager Modal */}
      {showManagerModal && selectedDriverForManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Assign Fleet Manager</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Assign a dispatcher to manage {selectedDriverForManager.first_name} {selectedDriverForManager.last_name}.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Dispatcher</Label>
                  <select
                    className="w-full border border-input rounded-xl px-3 py-2 bg-background text-foreground text-sm"
                    value={selectedDriverForManager.manager_id || 'unassigned'}
                    onChange={async (e) => {
                      const newManagerId = e.target.value;
                      try {
                        await api.put(`/drivers/${selectedDriverForManager.id}`, {
                          manager_id: newManagerId
                        });
                        showToast('Fleet Manager updated', 'success');
                        setShowManagerModal(false);
                        fetchDrivers();
                      } catch (err) {
                        showToast('Failed to update manager', 'error');
                      }
                    }}
                  >
                    <option value="unassigned">Unassigned</option>
                    {dispatchers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowManagerModal(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HOS Modal */}
      {showHOSModal && selectedDriverForHOS && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button 
              onClick={() => {
                setShowHOSModal(false);
                fetchDrivers();
              }}
              className="absolute -top-10 right-0 text-white hover:text-gray-200 font-medium"
            >
              Close
            </button>
            <HOSWidget driverId={selectedDriverForHOS.id} />
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        title={confirmModal.action === 'deactivate' ? 'Deactivate Driver' : 'Reset Password'}
        message={
          confirmModal.action === 'deactivate' 
            ? 'Are you sure you want to deactivate this driver?'
            : 'Are you sure you want to reset password for this driver?'
        }
        confirmText="Confirm"
        variant="danger"
      />

      <CredentialSuccessModal
        isOpen={!!credentialModalData}
        onClose={() => setCredentialModalData(null)}
        credentials={credentialModalData}
      />
    </div>
  );
};

export default DriverListPage;
