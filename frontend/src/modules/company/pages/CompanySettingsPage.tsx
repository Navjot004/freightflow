import React, { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { useToast } from '../../../components/ui/Toast';

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('team');
  

  
  const [employees, setEmployees] = useState<any[]>([]);
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRole, setEmpRole] = useState('DISPATCHER');
  const [createdEmpInfo, setCreatedEmpInfo] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const res = await api.get('/companies/me/employees');
    setEmployees(res.data);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/companies/me/employees', { 
        first_name: empFirstName,
        last_name: empLastName,
        email: empEmail, 
        password: empPassword || undefined,
        role_name: empRole 
      });
      toast("Employee created successfully!", 'success');
      setCreatedEmpInfo(res.data);
      setEmpFirstName('');
      setEmpLastName('');
      setEmpEmail('');
      setEmpPassword('');
      setEmpRole('DISPATCHER');
      fetchEmployees();
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to create employee", 'error');
    }
  };

  const handleResetPassword = async (employeeId: string) => {
    if (!confirm("Are you sure you want to reset this employee's password?")) return;
    try {
      const res = await api.post(`/companies/me/employees/${employeeId}/reset-password`);
      toast("Password reset successfully!", 'success');
      setCreatedEmpInfo({
        email: employees.find(e => e.id === employeeId)?.email,
        password: res.data.new_password
      });
    } catch (err: any) {
      toast(err.response?.data?.detail || "Failed to reset password", 'error');
    }
  };

  // Removed handleSaveProfile since profile management moved to Profile Page

  return (
    <div className="space-y-6">
      <Tabs>
        <TabsList>
          <TabsTrigger active={activeTab === 'team'} onClick={() => setActiveTab('team')}>Team Directory</TabsTrigger>
        </TabsList>

        <TabsContent active={activeTab === 'team'}>
          <Card>
            <CardHeader>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Manage your company employees, dispatchers, and drivers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-slate-50 p-4 rounded-lg border">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    type="text" 
                    placeholder="First" 
                    value={empFirstName} 
                    onChange={e => setEmpFirstName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input 
                    type="text" 
                    placeholder="Last" 
                    value={empLastName} 
                    onChange={e => setEmpLastName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    type="email" 
                    placeholder="employee@company.com" 
                    value={empEmail} 
                    onChange={e => setEmpEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password (Leave blank to generate)</Label>
                  <Input 
                    type="text" 
                    placeholder="Optional" 
                    value={empPassword} 
                    onChange={e => setEmpPassword(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={empRole} 
                    onChange={e => setEmpRole(e.target.value)}
                  >
                    <option value="DISPATCHER">Dispatcher</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Create Employee</Button>
              </form>

              {createdEmpInfo && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-1">Employee {createdEmpInfo.email} created!</p>
                  <p className="text-sm text-green-700">Please provide them with these login credentials:</p>
                  <div className="mt-2 bg-white p-2 rounded border font-mono text-sm">
                    <div>Email: {createdEmpInfo.email}</div>
                    <div>Password: {createdEmpInfo.password}</div>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.first_name} {emp.last_name}</TableCell>
                      <TableCell>{emp.email}</TableCell>
                      <TableCell>{emp.is_active ? 'Active' : 'Inactive'}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResetPassword(emp.id)}
                        >
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
