import React, { useEffect, useState } from 'react';
import api from '../../../core/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Truck, Shield, Calendar, Activity } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';

export default function MyVehiclePage() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  
  // Form State
  const [formData, setFormData] = useState({
    truck_number: '',
    trailer_number: '',
    equipment_type: '',
    capacity_lbs: '',
    status: '',
    insurance_expiry: '',
    registration_expiry: '',
    maintenance_date: ''
  });

  const fetchVehicle = async () => {
    try {
      const res = await api.get('/companies/me/vehicle');
      setVehicle(res.data);
      setFormData({
        truck_number: res.data.truck_number || '',
        trailer_number: res.data.trailer_number || '',
        equipment_type: res.data.equipment_type || '',
        capacity_lbs: res.data.capacity_lbs || '',
        status: res.data.status || 'ACTIVE',
        insurance_expiry: res.data.insurance_expiry || '',
        registration_expiry: res.data.registration_expiry || '',
        maintenance_date: res.data.maintenance_date || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put('/companies/me/vehicle', formData);
      toast('Vehicle updated successfully!', 'success');
      fetchVehicle();
      setIsEditing(false);
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Failed to update vehicle', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Vehicle</h2>
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Vehicle</h2>
          <p className="text-muted-foreground">Manage your truck, trailer, and compliance documents.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            Edit Vehicle
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Truck Number / VIN</Label>
                  <Input value={formData.truck_number} onChange={e => setFormData({...formData, truck_number: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Trailer Number (Optional)</Label>
                  <Input value={formData.trailer_number} onChange={e => setFormData({...formData, trailer_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Equipment Type</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.equipment_type} 
                    onChange={e => setFormData({...formData, equipment_type: e.target.value})}
                    required
                  >
                    <option value="">-- Select --</option>
                    <option value="DRY_VAN">Dry Van</option>
                    <option value="FLATBED">Flatbed</option>
                    <option value="REFRIGERATED">Refrigerated</option>
                    <option value="STEP_DECK">Step Deck</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Capacity (lbs)</Label>
                  <Input type="number" value={formData.capacity_lbs} onChange={e => setFormData({...formData, capacity_lbs: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Insurance Expiry Date</Label>
                  <Input type="date" value={formData.insurance_expiry} onChange={e => setFormData({...formData, insurance_expiry: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Registration Expiry Date</Label>
                  <Input type="date" value={formData.registration_expiry} onChange={e => setFormData({...formData, registration_expiry: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Maintenance Date</Label>
                  <Input type="date" value={formData.maintenance_date} onChange={e => setFormData({...formData, maintenance_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="IN_SHOP">In Shop</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><Truck className="h-4 w-4 mr-2" /> Vehicle Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicle?.truck_number || 'N/A'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Equipment: {vehicle?.equipment_type?.replace('_', ' ') || 'Not Specified'}
              </p>
              <p className="text-xs text-muted-foreground">
                Trailer: {vehicle?.trailer_number || 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">
                Capacity: {vehicle?.capacity_lbs ? `${vehicle.capacity_lbs} lbs` : 'N/A'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><Activity className="h-4 w-4 mr-2" /> Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vehicle?.status || 'ACTIVE'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current Operational Status
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><Shield className="h-4 w-4 mr-2" /> Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Insurance:</span>
                  <span className={!vehicle?.insurance_expiry || new Date(vehicle.insurance_expiry) < new Date() ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {vehicle?.insurance_expiry || 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Registration:</span>
                  <span className={!vehicle?.registration_expiry || new Date(vehicle.registration_expiry) < new Date() ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                    {vehicle?.registration_expiry || 'Missing'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center"><Calendar className="h-3 w-3 mr-1" /> Maintenance:</span>
                  <span className="font-medium">
                    {vehicle?.maintenance_date || 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
