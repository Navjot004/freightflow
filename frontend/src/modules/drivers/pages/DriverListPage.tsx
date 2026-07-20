import React, { useState, useEffect } from 'react';
import { getDrivers, createDriver, deactivateDriver, resetDriverPassword } from '../api';
import { useToast } from '../../../components/ui/Toast';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Plus, Trash2, Key, Users } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { Clock } from 'lucide-react';
import { HOSWidget } from '../components/HOSWidget';

import api from '../../../core/api';
import { useAuthStore } from '../../../store/authStore';

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
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'deactivate' | 'reset_password' | null;
    driverId: string | null;
  }>({
    isOpen: false,
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
        } catch (err) {
          console.error("Failed to fetch employees", err);
        }
      }

      const data = await getDrivers();
      setDrivers(data);

      if (employeesData && employeesData.team_members) {
        setDispatchers(employeesData.team_members.filter((m: any) => m.role?.name === 'DISPATCHER'));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground dark:text-white">Fleet / Drivers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Driver
        </button>
      </div>

      {tempPassword && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
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

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No drivers found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add your first driver to start assigning loads.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Driver
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
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
              {drivers.map((driver) => (
                <tr key={driver.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">
                      {driver.first_name} {driver.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{driver.email}</div>
                    <div className="text-sm text-muted-foreground">{driver.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {driver.manager_name ? driver.manager_name : <span className="text-gray-400 italic">Unassigned</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={driver.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {driver.current_hos_status ? driver.current_hos_status.replace(/_/g, ' ') : 'OFF DUTY'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => {
                        setSelectedDriverForHOS(driver);
                        setShowHOSModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
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
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        title="Change Dispatcher"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                    )}
                    <button  
                      onClick={() => handleResetPassword(driver.id)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Reset Password"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {driver.status !== 'SUSPENDED' && (
                      <button 
                        onClick={() => handleDeactivate(driver.id)}
                        className="text-red-600 hover:text-red-900"
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
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && !tempPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-xl">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      required
                      value={newDriver.last_name}
                      onChange={(e) => setNewDriver({...newDriver, last_name: e.target.value})}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                  />
                </div>

                {isAdmin && (
                  <div className="space-y-2">
                    <Label>Fleet Manager (Dispatcher)</Label>
                    <select
                      className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground"
                      value={newDriver.manager_id}
                      onChange={(e) => setNewDriver({...newDriver, manager_id: e.target.value})}
                    >
                      <option value="unassigned">Unassigned (Assign later)</option>
                      {dispatchers.map(d => (
                        <option key={d.user_id} value={d.user_id}>
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
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
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
          <Card className="max-w-md w-full shadow-xl">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Assign Fleet Manager</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Assign a dispatcher to manage {selectedDriverForManager.first_name} {selectedDriverForManager.last_name}.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Dispatcher</Label>
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 bg-background text-foreground"
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
                      <option key={d.user_id} value={d.user_id}>
                        {d.first_name} {d.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowManagerModal(false)}
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
                fetchDrivers(); // refresh to get updated HOS status in list
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
