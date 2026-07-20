import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import api from '../../../core/api';
import { useToast } from '../../../components/ui/Toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { Skeleton } from '../../../components/ui/Skeleton';

export default function UserProfilePage() {
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);
  const login = useAuthStore(state => state.login);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalFormData, setPersonalFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Company State
  const [company, setCompany] = useState<any>(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyFormData, setCompanyFormData] = useState<any>({});
  const [profile, setProfile] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);

  // Re-sync if user changes
  useEffect(() => {
    if (user && !isEditingPersonal) {
      setPersonalFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || ''
      });
    }
  }, [user, isEditingPersonal]);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await api.get('/companies/me');
      setCompany(res.data);
      setCompanyFormData({
        name: res.data.name || '',
        dot_number: res.data.dot_number || '',
        mc_number: res.data.mc_number || '',
        tax_id: res.data.tax_id || '',
        insurance_expiry_date: res.data.insurance_expiry_date || '',
      });
      
      if (res.data.type === 'CARRIER') {
        fetchProfile();
      } else if (res.data.type === 'OWNER_OPERATOR') {
        fetchVehicle();
      }
    } catch (e) {}
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get('/companies/me/profile');
      setProfile(res.data);
      setCompanyFormData((prev: any) => ({
        ...prev,
        fleet_size: res.data.fleet_size || 0,
        equipment_types: res.data.equipment_types ? res.data.equipment_types.join(', ') : '',
        operating_regions: res.data.operating_regions ? res.data.operating_regions.join(', ') : '',
      }));
    } catch (e) {}
  };

  const fetchVehicle = async () => {
    try {
      const res = await api.get('/companies/me/vehicle');
      setVehicle(res.data);
      setCompanyFormData((prev: any) => ({
        ...prev,
        vehicle_equipment_type: res.data.equipment_type || '',
      }));
    } catch (e) {}
  };

  const handlePersonalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalFormData({ ...personalFormData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleCompanyInputChange = (field: string, value: string) => {
    setCompanyFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSavePersonal = async () => {
    try {
      const res = await api.put('/auth/me', personalFormData);
      toast('Profile updated successfully', 'success');
      setIsEditingPersonal(false);
      if (token) {
        login(token, res.data);
      }
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to update profile', 'error');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast('New passwords do not match', 'error');
      return;
    }
    
    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      toast('Password changed successfully', 'success');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      toast(error.response?.data?.detail || 'Failed to change password', 'error');
    }
  };

  const handleSaveCompanyProfile = async () => {
    try {
      // 1. Update core company
      await api.put('/companies/me', {
        name: companyFormData.name,
        dot_number: companyFormData.dot_number,
        mc_number: companyFormData.mc_number,
        tax_id: companyFormData.tax_id,
        insurance_expiry_date: companyFormData.insurance_expiry_date
      });
      
      // 2. Update specific profile if applicable
      if (company?.type === 'CARRIER') {
        await api.put('/companies/me/profile', {
          fleet_size: parseInt(companyFormData.fleet_size) || 0,
          equipment_types: companyFormData.equipment_types.split(',').map((s: string) => s.trim()).filter((s: string) => s),
          operating_regions: companyFormData.operating_regions.split(',').map((s: string) => s.trim()).filter((s: string) => s),
        });
      } else if (company?.type === 'OWNER_OPERATOR') {
        await api.put('/companies/me/vehicle', {
          equipment_type: companyFormData.vehicle_equipment_type
        });
      }

      toast("Company profile updated successfully!", 'success');
      setIsEditingCompany(false);
      fetchCompany();
    } catch (err: any) {
      toast("Failed to update company profile", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Manage your personal and public company details.</p>
      </div>

      <Tabs>
        <TabsList>
          <TabsTrigger active={activeTab === 'personal'} onClick={() => setActiveTab('personal')}>Personal Details</TabsTrigger>
          <TabsTrigger active={activeTab === 'company'} onClick={() => setActiveTab('company')}>Company Profile</TabsTrigger>
          <TabsTrigger active={activeTab === 'security'} onClick={() => setActiveTab('security')}>Security</TabsTrigger>
        </TabsList>

        <TabsContent active={activeTab === 'personal'} className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (isEditingPersonal) {
                    setIsEditingPersonal(false);
                    setPersonalFormData({
                      first_name: user?.first_name || '',
                      last_name: user?.last_name || '',
                      phone_number: user?.phone_number || ''
                    });
                  } else {
                    setIsEditingPersonal(true);
                  }
                }}
              >
                {isEditingPersonal ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    name="first_name" 
                    value={personalFormData.first_name} 
                    onChange={handlePersonalInputChange} 
                    disabled={!isEditingPersonal} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input 
                    name="last_name" 
                    value={personalFormData.last_name} 
                    onChange={handlePersonalInputChange} 
                    disabled={!isEditingPersonal} 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Email Address</Label>
                  <Input 
                    value={user?.email || ''} 
                    disabled 
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email addresses cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    name="phone_number" 
                    value={personalFormData.phone_number} 
                    onChange={handlePersonalInputChange} 
                    disabled={!isEditingPersonal}
                    placeholder="e.g. 555-123-4567"
                  />
                </div>
              </div>
            </CardContent>
            {isEditingPersonal && (
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button onClick={handleSavePersonal}>Save Changes</Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent active={activeTab === 'company'} className="mt-4">
          {!company ? (
            <div className="space-y-4 p-4 md:p-6">
              <Skeleton className="h-10 w-1/4" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>Company & Directory Profile</CardTitle>
                  <CardDescription>
                    These details represent your company and form your public profile visible to partners in the directory.
                  </CardDescription>
                </div>
                {/* Only allow company admins to edit company profile. */}
                {(user?.role?.name === 'COMPANY_ADMIN' || user?.role?.name === 'SUPER_ADMIN') && (
                  <Button variant="outline" onClick={() => {
                    if (isEditingCompany) {
                      setIsEditingCompany(false);
                      setCompanyFormData({
                        name: company.name || '',
                        dot_number: company.dot_number || '',
                        mc_number: company.mc_number || '',
                        tax_id: company.tax_id || '',
                        insurance_expiry_date: company.insurance_expiry_date || '',
                        fleet_size: profile?.fleet_size || 0,
                        equipment_types: profile?.equipment_types ? profile.equipment_types.join(', ') : '',
                        operating_regions: profile?.operating_regions ? profile.operating_regions.join(', ') : '',
                        vehicle_equipment_type: vehicle?.equipment_type || '',
                      });
                    } else {
                      setIsEditingCompany(true);
                    }
                  }}>
                    {isEditingCompany ? 'Cancel' : 'Edit Company Profile'}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input 
                      value={isEditingCompany ? companyFormData.name : company.name} 
                      onChange={e => handleCompanyInputChange('name', e.target.value)}
                      disabled={!isEditingCompany} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Type</Label>
                    <Input value={company.type} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Verification Status</Label>
                    <Input value={company.status} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>DOT Number</Label>
                    <Input 
                      value={isEditingCompany ? companyFormData.dot_number : (company.dot_number || '')} 
                      onChange={e => handleCompanyInputChange('dot_number', e.target.value)}
                      disabled={!isEditingCompany}
                      placeholder="e.g. 1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>MC Number</Label>
                    <Input 
                      value={isEditingCompany ? companyFormData.mc_number : (company.mc_number || '')} 
                      onChange={e => handleCompanyInputChange('mc_number', e.target.value)}
                      disabled={!isEditingCompany}
                      placeholder="e.g. MC-123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input 
                      value={isEditingCompany ? companyFormData.tax_id : (company.tax_id || '')} 
                      onChange={e => handleCompanyInputChange('tax_id', e.target.value)}
                      disabled={!isEditingCompany}
                      placeholder="e.g. 12-3456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Expiry Date</Label>
                    <Input 
                      type="date"
                      value={isEditingCompany ? companyFormData.insurance_expiry_date : (company.insurance_expiry_date || '')} 
                      onChange={e => handleCompanyInputChange('insurance_expiry_date', e.target.value)}
                      disabled={!isEditingCompany}
                    />
                  </div>
                </div>

                {/* Carrier Profile Specific Fields */}
                {company.type === 'CARRIER' && (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Fleet & Operations Profile</h3>
                    <p className="text-sm text-muted-foreground -mt-3">These fields will be shown to Brokers in the Partnership Directory.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fleet Size</Label>
                        <Input 
                          type="number"
                          value={isEditingCompany ? companyFormData.fleet_size : (profile?.fleet_size || 0)} 
                          onChange={e => handleCompanyInputChange('fleet_size', e.target.value)}
                          disabled={!isEditingCompany}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Equipment Types</Label>
                        <Input 
                          value={isEditingCompany ? companyFormData.equipment_types : (profile?.equipment_types?.join(', ') || '')} 
                          onChange={e => handleCompanyInputChange('equipment_types', e.target.value)}
                          disabled={!isEditingCompany}
                          placeholder="e.g. Dry Van, Reefer (comma separated)"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Operating Regions</Label>
                        <Input 
                          value={isEditingCompany ? companyFormData.operating_regions : (profile?.operating_regions?.join(', ') || '')} 
                          onChange={e => handleCompanyInputChange('operating_regions', e.target.value)}
                          disabled={!isEditingCompany}
                          placeholder="e.g. National, Northeast, Texas (comma separated)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner Operator Specific Fields */}
                {company.type === 'OWNER_OPERATOR' && (
                  <div className="pt-4 border-t space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Vehicle Profile</h3>
                    <p className="text-sm text-muted-foreground -mt-3">These fields will be shown to Brokers in the Partnership Directory.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vehicle Equipment Type</Label>
                        <Input 
                          value={isEditingCompany ? companyFormData.vehicle_equipment_type : (vehicle?.equipment_type || '')} 
                          onChange={e => handleCompanyInputChange('vehicle_equipment_type', e.target.value)}
                          disabled={!isEditingCompany}
                          placeholder="e.g. Dry Van"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {isEditingCompany && (
                  <div className="pt-4 border-t flex justify-end">
                    <Button onClick={handleSaveCompanyProfile}>Save Profile</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent active={activeTab === 'security'} className="mt-4">
          <Card>
            <form onSubmit={handleSavePassword}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password to stay secure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input 
                    type="password" 
                    name="current_password"
                    value={passwordData.current_password} 
                    onChange={handlePasswordChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input 
                    type="password" 
                    name="new_password"
                    value={passwordData.new_password} 
                    onChange={handlePasswordChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password" 
                    name="confirm_password"
                    value={passwordData.confirm_password} 
                    onChange={handlePasswordChange} 
                    required 
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button type="submit">Change Password</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
