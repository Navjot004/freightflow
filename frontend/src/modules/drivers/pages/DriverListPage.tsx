import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getDrivers, createDriver, deactivateDriver, resetDriverPassword } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Plus, Trash2, Key, Users, Search, Filter, RefreshCw, X, Clock, ChevronDown, Check } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { HOSWidget } from '../components/HOSWidget';

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
  const [newDriver, setNewDriver] = useState({ first_name: '', last_name: '', email: '', phone: '', manager_id: 'unassigned' });
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Search & Filter state variables
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDispatcher, setSelectedDispatcher] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedHosStatus, setSelectedHosStatus] = useState('ALL');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'deactivate' | 'reset_password' | null;
    driverId: string | null;
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
          showToast(`Failed to load dispatchers: ${err.message}`, 'error');
        }
      }

      const data = await getDrivers();
      setDrivers(data);

      if (Array.isArray(employeesData)) {
        setDispatchers(employeesData.filter((m: any) => m.role?.name === 'DISPATCHER'));
      }
    } catch (error) {
      showToast('Failed to load drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createDriver(newDriver);
      setTempPassword(response.temp_password);
      showToast('Driver created successfully', 'success');
      fetchDrivers();
      setNewDriver({ first_name: '', last_name: '', email: '', phone: '', manager_id: 'unassigned' });
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
    const { driverId, action } = confirmModal;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));

    if (action === 'deactivate') {
      try {
        await deactivateDriver(driverId);
        showToast('Driver deactivated', 'success');
        fetchDrivers();
      } catch (error) {
        showToast('Failed to deactivate driver', 'error');
      }
    } else if (action === 'reset_password') {
      try {
        const res = await resetDriverPassword(driverId);
        setTempPassword(res.temp_password);
        showToast('Password reset successfully', 'success');
        fetchDrivers();
      } catch (error) {
        showToast('Failed to reset password', 'error');
      }
    }
  };

  const handleDeactivate = (driverId: string) => {
    setConfirmModal({ isOpen: true, action: 'deactivate', driverId });
  };

  const handleResetPassword = (driverId: string) => {
    setConfirmModal({ isOpen: true, action: 'reset_password', driverId });
  };

  // Filter & Search calculation
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      // 1. Search Query match (Name, Email, Phone, Manager Name)
      const q = searchQuery.toLowerCase().trim();
      const driverName = `${driver.first_name || ''} ${driver.last_name || ''}`.toLowerCase();
      const email = (driver.email || '').toLowerCase();
      const phone = (driver.phone || '').toLowerCase();
      const managerName = (driver.manager_name || '').toLowerCase();

      const matchesSearch =
        !q ||
        driverName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        managerName.includes(q);

      // 2. Dispatcher / Fleet Manager filter match
      let matchesDispatcher = true;
      if (selectedDispatcher === 'UNASSIGNED') {
        matchesDispatcher = !driver.manager_id && !driver.manager_name;
      } else if (selectedDispatcher !== 'ALL') {
        matchesDispatcher = driver.manager_id === selectedDispatcher;
      }

      // 3. Driver Status filter match
      const matchesStatus =
        selectedStatus === 'ALL' || driver.status === selectedStatus;

      // 4. HOS Status filter match
      const currentHos = driver.current_hos_status || 'OFF_DUTY';
      const matchesHos =
        selectedHosStatus === 'ALL' || currentHos === selectedHosStatus;

      return matchesSearch && matchesDispatcher && matchesStatus && matchesHos;
    });
  }, [drivers, searchQuery, selectedDispatcher, selectedStatus, selectedHosStatus]);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedDispatcher !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedHosStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDispatcher('ALL');
    setSelectedStatus('ALL');
    setSelectedHosStatus('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white">Fleet / Drivers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your carrier fleet drivers, dispatcher assignments, and HOS compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDrivers} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </Button>
        </div>
      </div>

      {tempPassword && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
          <h3 className="text-lg font-medium text-green-800">Temporary Password Generated</h3>
          <p className="mt-2 text-sm text-green-700">
            Please share this temporary password with the driver. They will be required to change it on their first login.
          </p>
          <div className="mt-3 bg-background p-3 border border-green-300 rounded font-mono text-lg font-bold text-center select-all">
            {tempPassword}
          </div>
          <button 
            onClick={() => setTempPassword(null)}
            className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar Card */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="p-4 border-b space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search driver by name, email, phone, or dispatcher..."
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

            {/* Driver Availability Status Filter */}
            <div className="min-w-[140px]">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ON_TRIP">On Trip</option>
                <option value="OFF_DUTY">Off Duty</option>
                <option value="SUSPENDED">Suspended</option>
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
              Showing <strong>{filteredDrivers.length}</strong> of <strong>{drivers.length}</strong> registered drivers
            </span>
          </div>
        </CardHeader>

        {/* Drivers Table */}
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-foreground">No drivers found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Add your first driver to start assigning loads.
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-primary text-primary-foreground rounded-xl"
              >
                Add Driver
              </Button>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No drivers match your search and filter criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fleet Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">HOS</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {driver.first_name} {driver.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-foreground">{driver.email}</div>
                      <div className="text-xs text-muted-foreground">{driver.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {driver.manager_name ? (
                          <span className="font-medium text-foreground">{driver.manager_name}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={driver.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200">
                        {driver.current_hos_status ? driver.current_hos_status.replace(/_/g, ' ') : 'OFF DUTY'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setSelectedDriverForHOS(driver);
                          setShowHOSModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-4"
                        title="Hours of Service"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setSelectedDriverForManager(driver);
                            setShowManagerModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 mr-4"
                          title="Change Dispatcher / Fleet Manager"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                      )}
                      <button  
                        onClick={() => handleResetPassword(driver.id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mr-4"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {driver.status !== 'SUSPENDED' && (
                        <button 
                          onClick={() => handleDeactivate(driver.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400"
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Modal */}
      {showAddModal && !tempPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Add New Driver</h2>
              <form onSubmit={handleAddDriver} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      required
                      value={newDriver.first_name}
                      onChange={(e) => setNewDriver({...newDriver, first_name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      required
                      value={newDriver.last_name}
                      onChange={(e) => setNewDriver({...newDriver, last_name: e.target.value})}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email (Used for login)</Label>
                  <Input
                    type="email"
                    required
                    value={newDriver.email}
                    onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                    className="rounded-xl"
                  />
                </div>

                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Fleet Manager (Dispatcher)</Label>
                    <select
                      className="w-full border border-input rounded-xl px-3 py-2 bg-background text-foreground text-sm"
                      value={newDriver.manager_id}
                      onChange={(e) => setNewDriver({...newDriver, manager_id: e.target.value})}
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
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-blue-600 hover:bg-blue-700"
                  >
                    Create Driver
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
    </div>
  );
};

export default DriverListPage;
