import React, { useState } from 'react';
import api from '../../../core/api';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { LocationSearchInput } from '../../../components/ui/LocationSearchInput';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../components/ui/Toast';
import { X, MapPin, Truck, ShieldCheck, CheckCircle2, AlertCircle, Scale, DollarSign, Package } from 'lucide-react';

interface EditLoadModalProps {
  load: any;
  onClose: () => void;
  onRefresh: () => void;
}

export const EditLoadModal: React.FC<EditLoadModalProps> = ({ load, onClose, onRefresh }) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Preset pills focus-reveal states
  const [showWeightPresets, setShowWeightPresets] = useState(false);
  const [showDimPresets, setShowDimPresets] = useState(false);

  // Format ISO dates to datetime-local inputs (YYYY-MM-DDTHH:mm)
  const formatForDateTimeInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const formatForDateInput = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  // Parse existing dimension string if available (e.g. "53ft × 8.5ft × 9ft" or "53 × 8.5 × 9 ft")
  const parseInitialDimensions = (dimStr: string) => {
    if (!dimStr) return { l: '', w: '', h: '', u: 'ft' };
    const match = dimStr.match(/([\d\.]+)\s*([a-zA-Z]*)\s*[×xX]\s*([\d\.]+)\s*([a-zA-Z]*)\s*[×xX]\s*([\d\.]+)\s*([a-zA-Z]*)/);
    if (match) {
      const l = match[1] || '';
      const w = match[3] || '';
      const h = match[5] || '';
      const u = match[2] || match[4] || match[6] || 'ft';
      return { l, w, h, u: u || 'ft' };
    }
    return { l: '', w: '', h: '', u: 'ft' };
  };

  const initialDims = parseInitialDimensions(load.dimensions || '');
  const [dimLength, setDimLength] = useState(initialDims.l);
  const [dimWidth, setDimWidth] = useState(initialDims.w);
  const [dimHeight, setDimHeight] = useState(initialDims.h);
  const [dimUnit, setDimUnit] = useState(initialDims.u);

  const [formData, setFormData] = useState({
    origin_address: load.origin_address || '',
    destination_address: load.destination_address || '',
    pickup_date: formatForDateTimeInput(load.pickup_date),
    delivery_date: formatForDateTimeInput(load.delivery_date),
    equipment_type: load.equipment_type || 'DRY_VAN',
    weight_lbs: load.weight_lbs?.toString() || '',
    rate: load.rate?.toString() || '',
    commodity: load.commodity || '',
    dimensions: load.dimensions || '',
    special_instructions: load.special_instructions || '',
    pickup_appointment_date: formatForDateInput(load.pickup_appointment_date),
    pickup_appointment_time: load.pickup_appointment_time || '',
    pickup_contact_person: load.pickup_contact_person || '',
    pickup_contact_number: load.pickup_contact_number || '',
    pickup_dock_number: load.pickup_dock_number || '',
    pickup_reference_number: load.pickup_reference_number || '',
    pickup_special_instructions: load.pickup_special_instructions || '',
    delivery_appointment_date: formatForDateInput(load.delivery_appointment_date),
    delivery_appointment_time: load.delivery_appointment_time || '',
    delivery_contact_person: load.delivery_contact_person || '',
    delivery_contact_number: load.delivery_contact_number || '',
    delivery_dock_number: load.delivery_dock_number || '',
    delivery_reference_number: load.delivery_reference_number || '',
    delivery_special_instructions: load.delivery_special_instructions || ''
  });

  const handleDimensionChange = (l: string, w: string, h: string, u: string) => {
    setDimLength(l);
    setDimWidth(w);
    setDimHeight(h);
    setDimUnit(u);

    if (l || w || h) {
      const formatted = `${l || 0}${u} × ${w || 0}${u} × ${h || 0}${u}`;
      setFormData(prev => ({ ...prev, dimensions: formatted }));
    } else {
      setFormData(prev => ({ ...prev, dimensions: '' }));
    }
  };

  const applyPresetDimensions = (l: string, w: string, h: string, u: string) => {
    handleDimensionChange(l, w, h, u);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: any = {
        ...formData,
        pickup_date: new Date(formData.pickup_date).toISOString(),
        delivery_date: new Date(formData.delivery_date).toISOString(),
        weight_lbs: parseInt(formData.weight_lbs) || 0,
        rate: formData.rate ? parseFloat(formData.rate) : null
      };

      if (formData.pickup_appointment_date) {
        payload.pickup_appointment_date = new Date(formData.pickup_appointment_date).toISOString();
      } else {
        payload.pickup_appointment_date = null;
      }
      
      if (formData.delivery_appointment_date) {
        payload.delivery_appointment_date = new Date(formData.delivery_appointment_date).toISOString();
      } else {
        payload.delivery_appointment_date = null;
      }

      await api.put(`/loads/${load.id}`, payload);
      toast('Load details updated successfully! Active bidders have been notified.', 'success');
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update load details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-border bg-card overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
          <div>
            <h3 className="text-lg font-bold text-foreground">Edit Load Details</h3>
            <p className="text-xs text-muted-foreground">
              Load ID: <span className="font-mono">{load.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form id="edit-load-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Route Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Route & Pickup/Delivery Schedule
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Origin Address *</Label>
                  <LocationSearchInput
                    id="origin_address"
                    name="origin_address"
                    value={formData.origin_address}
                    onChange={(val) => setFormData(prev => ({...prev, origin_address: val}))}
                    required
                    placeholder="City, State"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Destination Address *</Label>
                  <LocationSearchInput
                    id="destination_address"
                    name="destination_address"
                    value={formData.destination_address}
                    onChange={(val) => setFormData(prev => ({...prev, destination_address: val}))}
                    required
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Expected Pickup Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    name="pickup_date"
                    value={formData.pickup_date}
                    onChange={handleChange}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Expected Delivery Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    required
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Freight Specs */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                <Truck className="w-4 h-4 text-amber-500" /> Freight Specifications & Pricing
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Equipment Type *</Label>
                  <select
                    name="equipment_type"
                    value={formData.equipment_type}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                  >
                    <option value="DRY_VAN">Dry Van</option>
                    <option value="REEFER">Reefer</option>
                    <option value="FLATBED">Flatbed</option>
                    <option value="POWER_ONLY">Power Only</option>
                  </select>
                </div>

                {/* Weight Input with Presets */}
                <div className="space-y-2 relative">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-cyan-500" /> Weight (lbs) *
                  </Label>
                  <Input
                    type="number"
                    name="weight_lbs"
                    value={formData.weight_lbs}
                    onChange={handleChange}
                    onFocus={() => setShowWeightPresets(true)}
                    onBlur={() => setTimeout(() => setShowWeightPresets(false), 200)}
                    required
                    min={1}
                    className="rounded-xl text-xs font-mono"
                  />
                  {showWeightPresets && (
                    <div
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex flex-wrap items-center gap-1.5 pt-1.5 transition-all"
                    >
                      {[
                        { label: '10k lbs', val: '10000' },
                        { label: '24k lbs', val: '24000' },
                        { label: '42k lbs', val: '42000' },
                        { label: '45k lbs', val: '45000' }
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, weight_lbs: preset.val }))}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-muted hover:bg-primary/10 hover:text-primary text-foreground border border-border"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Target Rate ($)
                  </Label>
                  <Input
                    type="number"
                    name="rate"
                    value={formData.rate}
                    onChange={handleChange}
                    placeholder="e.g. 2500"
                    className="rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Commodity & 3-Part Cargo Dimensions */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-indigo-500" /> Commodity Description
                  </Label>
                  <Input
                    type="text"
                    name="commodity"
                    value={formData.commodity}
                    onChange={handleChange}
                    placeholder="e.g. Electronics, Pallets"
                    className="rounded-xl text-xs"
                  />
                </div>

                {/* 3-Part Cargo Dimensions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Cargo Dimensions (Length × Width × Height)</Label>
                    {formData.dimensions && (
                      <span className="text-[11px] font-mono text-primary font-bold">
                        Formatted: {formData.dimensions}
                      </span>
                    )}
                  </div>

                  <div
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                    onFocus={() => setShowDimPresets(true)}
                    onBlur={() => setTimeout(() => setShowDimPresets(false), 200)}
                  >
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Length (L)"
                        value={dimLength}
                        onChange={(e) => handleDimensionChange(e.target.value, dimWidth, dimHeight, dimUnit)}
                        className="rounded-xl text-xs font-mono pr-8"
                        min={0}
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase">{dimUnit}</span>
                    </div>

                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Width (W)"
                        value={dimWidth}
                        onChange={(e) => handleDimensionChange(dimLength, e.target.value, dimHeight, dimUnit)}
                        className="rounded-xl text-xs font-mono pr-8"
                        min={0}
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase">{dimUnit}</span>
                    </div>

                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Height (H)"
                        value={dimHeight}
                        onChange={(e) => handleDimensionChange(dimLength, dimWidth, e.target.value, dimUnit)}
                        className="rounded-xl text-xs font-mono pr-8"
                        min={0}
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground uppercase">{dimUnit}</span>
                    </div>

                    <div>
                      <select
                        value={dimUnit}
                        onChange={(e) => handleDimensionChange(dimLength, dimWidth, dimHeight, e.target.value)}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none"
                      >
                        <option value="ft">Feet (ft)</option>
                        <option value="in">Inches (in)</option>
                        <option value="m">Meters (m)</option>
                        <option value="cm">Centimeters (cm)</option>
                      </select>
                    </div>
                  </div>

                  {/* Focus Revealed Quick Dimension Presets */}
                  {showDimPresets && (
                    <div
                      onMouseDown={(e) => e.preventDefault()}
                      className="flex flex-wrap items-center gap-1.5 pt-1.5 transition-all"
                    >
                      {[
                        { label: '53ft Dry Van (53 × 8.5 × 9 ft)', l: '53', w: '8.5', h: '9', u: 'ft' },
                        { label: '48ft Flatbed (48 × 8.5 × 8.5 ft)', l: '48', w: '8.5', h: '8.5', u: 'ft' },
                        { label: '26ft Box Truck (26 × 8 × 8 ft)', l: '26', w: '8', h: '8', u: 'ft' }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => applyPresetDimensions(preset.l, preset.w, preset.h, preset.u)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-muted hover:bg-primary/10 hover:text-primary text-foreground border border-border"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Special Instructions</Label>
                  <textarea
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleChange}
                    placeholder="Special handling instructions..."
                    className="flex min-h-[70px] w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Confidential Facility Info */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" /> Confidential Facility Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                <div className="space-y-2">
                  <span className="font-bold text-xs text-foreground block">Pickup Dock / Ref #</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      name="pickup_dock_number"
                      value={formData.pickup_dock_number}
                      onChange={handleChange}
                      placeholder="Dock #"
                      className="rounded-xl text-xs h-8"
                    />
                    <Input
                      type="text"
                      name="pickup_reference_number"
                      value={formData.pickup_reference_number}
                      onChange={handleChange}
                      placeholder="Ref / BOL #"
                      className="rounded-xl text-xs h-8 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-xs text-foreground block">Delivery Dock / Ref #</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="text"
                      name="delivery_dock_number"
                      value={formData.delivery_dock_number}
                      onChange={handleChange}
                      placeholder="Door #"
                      className="rounded-xl text-xs h-8"
                    />
                    <Input
                      type="text"
                      name="delivery_reference_number"
                      value={formData.delivery_reference_number}
                      onChange={handleChange}
                      placeholder="PO #"
                      className="rounded-xl text-xs h-8 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>

          <Button
            type="submit"
            form="edit-load-form"
            disabled={submitting}
            className="rounded-xl text-xs bg-primary text-primary-foreground font-bold px-6 gap-2"
          >
            {submitting ? 'Updating Load...' : 'Save & Update Load'} <CheckCircle2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
