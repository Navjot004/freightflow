import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../core/api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { LocationSearchInput } from '../../../components/ui/LocationSearchInput';
import { Label } from '../../../components/ui/label';

export default function LoadCreationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    origin_address: '',
    destination_address: '',
    pickup_date: '',
    delivery_date: '',
    equipment_type: 'DRY_VAN',
    weight_lbs: '',
    commodity: '',
    dimensions: '',
    special_instructions: '',
    pickup_appointment_date: '',
    pickup_appointment_time: '',
    pickup_contact_person: '',
    pickup_contact_number: '',
    pickup_dock_number: '',
    pickup_reference_number: '',
    pickup_special_instructions: '',
    delivery_appointment_date: '',
    delivery_appointment_time: '',
    delivery_contact_person: '',
    delivery_contact_number: '',
    delivery_dock_number: '',
    delivery_reference_number: '',
    delivery_special_instructions: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        ...formData,
        pickup_date: new Date(formData.pickup_date).toISOString(),
        delivery_date: new Date(formData.delivery_date).toISOString(),
        weight_lbs: parseInt(formData.weight_lbs)
      };

      if (formData.pickup_appointment_date) {
        payload.pickup_appointment_date = new Date(formData.pickup_appointment_date).toISOString();
      } else {
        delete payload.pickup_appointment_date;
      }
      
      if (formData.delivery_appointment_date) {
        payload.delivery_appointment_date = new Date(formData.delivery_appointment_date).toISOString();
      } else {
        delete payload.delivery_appointment_date;
      }
      await api.post('/loads', payload);
      navigate('/loads/my-loads');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create load');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Post a Load</h2>
        <Button variant="outline" onClick={() => navigate('/loads/my-loads')}>Back to My Loads</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Load Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="origin_address">Origin</Label>
                <LocationSearchInput id="origin_address" name="origin_address" value={formData.origin_address} onChange={(val) => setFormData(prev => ({...prev, origin_address: val}))} required placeholder="City, State" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination_address">Destination</Label>
                <LocationSearchInput id="destination_address" name="destination_address" value={formData.destination_address} onChange={(val) => setFormData(prev => ({...prev, destination_address: val}))} required placeholder="City, State" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_date">Pickup Date</Label>
                <Input type="datetime-local" id="pickup_date" name="pickup_date" value={formData.pickup_date} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input type="datetime-local" id="delivery_date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_type">Equipment Type</Label>
                <select
                  id="equipment_type"
                  name="equipment_type"
                  value={formData.equipment_type}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="DRY_VAN">Dry Van</option>
                  <option value="REEFER">Reefer</option>
                  <option value="FLATBED">Flatbed</option>
                  <option value="POWER_ONLY">Power Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_lbs">Weight (lbs)</Label>
                <Input type="number" id="weight_lbs" name="weight_lbs" value={formData.weight_lbs} onChange={handleChange} required min={1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commodity">Commodity (Optional)</Label>
                <Input type="text" id="commodity" name="commodity" value={formData.commodity} onChange={handleChange} placeholder="e.g. Pallets, Electronics" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions (Optional)</Label>
                <Input type="text" id="dimensions" name="dimensions" value={formData.dimensions} onChange={handleChange} placeholder="e.g. 53ft x 102in x 110in" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_instructions">Special Instructions (Optional)</Label>
              <textarea
                id="special_instructions"
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleChange as any}
                placeholder="e.g. Needs tarps, driver assist"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="pt-6 border-t mt-6">
              <h3 className="text-lg font-medium text-foreground mb-1">Confidential Appointments</h3>
              <p className="text-sm text-muted-foreground mb-4">This information will be hidden from the Marketplace and only visible to the Carrier and Driver after load assignment.</p>
              
              <div className="space-y-6">
                <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50">
                  <h4 className="font-semibold text-sm mb-3 text-slate-800 dark:text-slate-200">Pickup Appointment (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup_appointment_date">Date</Label>
                      <Input type="date" id="pickup_appointment_date" name="pickup_appointment_date" value={formData.pickup_appointment_date} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_appointment_time">Time</Label>
                      <Input type="time" id="pickup_appointment_time" name="pickup_appointment_time" value={formData.pickup_appointment_time} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup_contact_person">Contact Person</Label>
                      <Input type="text" id="pickup_contact_person" name="pickup_contact_person" value={formData.pickup_contact_person} onChange={handleChange} placeholder="Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_contact_number">Contact Number</Label>
                      <Input type="text" id="pickup_contact_number" name="pickup_contact_number" value={formData.pickup_contact_number} onChange={handleChange} placeholder="Phone" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="pickup_dock_number">Dock Number</Label>
                      <Input type="text" id="pickup_dock_number" name="pickup_dock_number" value={formData.pickup_dock_number} onChange={handleChange} placeholder="e.g. 4B" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickup_reference_number">Reference Number</Label>
                      <Input type="text" id="pickup_reference_number" name="pickup_reference_number" value={formData.pickup_reference_number} onChange={handleChange} placeholder="e.g. PU-12345" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickup_special_instructions">Pickup Instructions</Label>
                    <Input type="text" id="pickup_special_instructions" name="pickup_special_instructions" value={formData.pickup_special_instructions} onChange={handleChange} placeholder="e.g. Gate code 1234" />
                  </div>
                </div>

                <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50">
                  <h4 className="font-semibold text-sm mb-3 text-slate-800 dark:text-slate-200">Delivery Appointment (Optional)</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_appointment_date">Date</Label>
                      <Input type="date" id="delivery_appointment_date" name="delivery_appointment_date" value={formData.delivery_appointment_date} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_appointment_time">Time</Label>
                      <Input type="time" id="delivery_appointment_time" name="delivery_appointment_time" value={formData.delivery_appointment_time} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_contact_person">Contact Person</Label>
                      <Input type="text" id="delivery_contact_person" name="delivery_contact_person" value={formData.delivery_contact_person} onChange={handleChange} placeholder="Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_contact_number">Contact Number</Label>
                      <Input type="text" id="delivery_contact_number" name="delivery_contact_number" value={formData.delivery_contact_number} onChange={handleChange} placeholder="Phone" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="delivery_dock_number">Dock Number</Label>
                      <Input type="text" id="delivery_dock_number" name="delivery_dock_number" value={formData.delivery_dock_number} onChange={handleChange} placeholder="e.g. 10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery_reference_number">Reference Number</Label>
                      <Input type="text" id="delivery_reference_number" name="delivery_reference_number" value={formData.delivery_reference_number} onChange={handleChange} placeholder="e.g. PO-9876" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_special_instructions">Delivery Instructions</Label>
                    <Input type="text" id="delivery_special_instructions" name="delivery_special_instructions" value={formData.delivery_special_instructions} onChange={handleChange} placeholder="e.g. Call 1 hour prior" />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Posting...' : 'Post Load to Marketplace'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
