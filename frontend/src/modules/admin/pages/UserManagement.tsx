import { useEffect, useState, useMemo } from 'react';
import api from '../../../core/api';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { Search, Filter, RefreshCw, X, UserCheck, UserX, Key, Eye, EyeOff } from 'lucide-react';

interface UserRoleInfo {
  label: string;
  key: string;
  badgeClass: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // Password Reset Modal states
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error(e);
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      setTogglingId(id);
      const res = await api.post(`/admin/users/${id}/toggle-status`);
      const updatedUser = res.data;
      if (updatedUser && updatedUser.is_active === false) {
        toast('User suspended. In-transit loads will complete POD & invoicing before full cascade.', 'info');
      } else {
        toast('User reactivated successfully', 'success');
      }
      await fetchUsers();
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to update user status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetModalUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast('Password must be at least 6 characters long', 'error');
      return;
    }
    try {
      setResetting(true);
      await api.post(`/admin/users/${resetModalUser.id}/reset-password`, { new_password: newPassword });
      toast(`Password updated successfully for ${resetModalUser.email}`, 'success');
      setResetModalUser(null);
      setNewPassword('');
    } catch (e: any) {
      toast(e.response?.data?.detail || 'Failed to reset password', 'error');
    } finally {
      setResetting(false);
    }
  };

  // Determine standard display role & filter key
  const getUserRoleInfo = (u: any): UserRoleInfo => {
    const roleName = u.role?.name;
    const companyType = u.company?.type;

    if (roleName === 'SUPER_ADMIN') {
      return {
        label: 'Super Admin',
        key: 'SUPER_ADMIN',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200'
      };
    }

    if (roleName === 'DRIVER') {
      return {
        label: 'Driver',
        key: 'DRIVER',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
      };
    }

    if (roleName === 'DISPATCHER') {
      return {
        label: 'Dispatcher',
        key: 'DISPATCHER',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200'
      };
    }

    if (companyType === 'OWNER_OPERATOR') {
      return {
        label: 'Owner Operator',
        key: 'OWNER_OPERATOR',
        badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200'
      };
    }

    if (companyType === 'SHIPPER') {
      return {
        label: 'Shipper',
        key: 'SHIPPER',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200'
      };
    }

    if (companyType === 'BROKER') {
      return {
        label: 'Broker',
        key: 'BROKER',
        badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200'
      };
    }

    if (companyType === 'CARRIER') {
      return {
        label: 'Carrier',
        key: 'CARRIER',
        badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200'
      };
    }

    return {
      label: roleName || 'User',
      key: roleName || 'USER',
      badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200'
    };
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const roleInfo = getUserRoleInfo(u);
      
      // Search term match (Name, Email, or Company Name)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.company?.name && u.company.name.toLowerCase().includes(q));

      // Role filter match
      const matchesRole = selectedRole === 'ALL' || roleInfo.key === selectedRole;

      // Status filter match
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && u.is_active) ||
        (selectedStatus === 'SUSPENDED' && !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  const hasActiveFilters = searchQuery !== '' || selectedRole !== 'ALL' || selectedStatus !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage user accounts, roles, access, and security credentials across FreightFlow.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
                >
                  <option value="ALL">All Roles</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="SHIPPER">Shipper</option>
                  <option value="BROKER">Broker</option>
                  <option value="CARRIER">Carrier</option>
                  <option value="DISPATCHER">Dispatcher</option>
                  <option value="DRIVER">Driver</option>
                  <option value="OWNER_OPERATOR">Owner Operator</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 px-3 text-xs rounded-md border border-input bg-background hover:bg-accent/50 transition-colors"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="SUSPENDED">Suspended Only</option>
                </select>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs gap-1 text-muted-foreground">
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            Showing <span className="font-semibold text-foreground">{filteredUsers.length}</span> of <span className="font-semibold text-foreground">{users.length}</span> registered users
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto rounded-xl" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No matching users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const roleInfo = getUserRoleInfo(u);
                  const isToggling = togglingId === u.id;

                  return (
                    <TableRow key={u.id}>
                      {/* Name */}
                      <TableCell className="font-medium text-foreground">
                        {u.first_name} {u.last_name}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {u.email}
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleInfo.badgeClass}`}>
                          {roleInfo.label}
                        </span>
                      </TableCell>

                      {/* Company */}
                      <TableCell className="text-foreground">
                        {u.company?.name ? (
                          <span className="font-medium">{u.company.name}</span>
                        ) : (
                          <span className="text-muted-foreground italic">N/A</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.is_active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                          }`}
                        >
                          {u.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword('');
                              setShowPassword(false);
                            }}
                            className="rounded-xl text-xs h-8 gap-1"
                            title="Reset User Password"
                          >
                            <Key className="w-3.5 h-3.5 text-primary" />
                            Reset Password
                          </Button>
                          <Button
                            size="sm"
                            variant={u.is_active ? "destructive" : "outline"}
                            disabled={isToggling}
                            onClick={() => handleToggle(u.id)}
                            className="rounded-xl text-xs h-8"
                          >
                            {isToggling ? (
                              'Updating...'
                            ) : u.is_active ? (
                              'Suspend'
                            ) : (
                              'Activate'
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Super Admin Password Reset Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">Reset User Password</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setResetModalUser(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Set a new password for <span className="font-mono font-bold text-foreground">{resetModalUser.email}</span>.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter at least 6 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setResetModalUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={resetting || !newPassword}>
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
